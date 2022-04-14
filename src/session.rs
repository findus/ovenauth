use actix_broker::BrokerIssue;
use actix::{fut, prelude::*};
use actix_web_actors::ws;
use actix_web_actors::ws::ProtocolError;
use crate::chatmessages::{ChatMessage, JoinRoom, LeaveRoom, SendMessage};
use crate::websocket::ChatServer;

#[derive(Default)]
pub struct ChatSession {
    pub(crate) id: usize,
    pub(crate) room: String,
    pub(crate) name: Option<String>,
}

impl ChatSession {
    pub fn join_room(&mut self, room_name: &str, ctx: &mut ws::WebsocketContext<Self>) {
        let room_name = room_name.to_owned();

        let leave_msg = LeaveRoom(self.room.clone(), self.id);

        self.issue_system_sync(leave_msg, ctx);

        let join_msg = JoinRoom(
            room_name.to_owned(),
            self.name.clone(),
            ctx.address().recipient(),
        );

        ChatServer::from_registry()
            .send(join_msg)
            .into_actor(self)
            .then(|id, act, _ctx| {
                if let Ok(id) = id {
                    act.id = id;
                    act.room = room_name;
                }

                fut::ready(())
            })
            .wait(ctx);
    }

    pub fn send_msg(&self, msg: &str) {
        let content = format!(
            "{}: {}",
            self.name.clone().unwrap_or_else(|| "Uwe".to_string()),
            msg
        );

        let msg = SendMessage(self.room.clone(), self.id, content);

        self.issue_system_async(msg);
    }
}

impl Handler<ChatMessage> for ChatSession {
    type Result = ();

    fn handle(&mut self, msg: ChatMessage, ctx: &mut Self::Context) -> Self::Result {
        ctx.text(msg.0);
    }
}

impl Actor for ChatSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.join_room("fluss", ctx);
    }

    fn stopped(&mut self, ctx: &mut Self::Context) {
        log::info!(
            "WsChatSession closed for {}({}) in room {}",
            self.name.clone().unwrap_or_else(|| "anon".to_string()),
            self.id,
            self.room
        );
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for ChatSession {
    fn handle(&mut self, msg: Result<ws::Message, ProtocolError>, ctx: &mut Self::Context) {

        let msg = match msg {
            Err(_) => {
                ctx.stop();
                return;
            }
            Ok(msg) => msg,
        };

        log::debug!("WS MSG: {:?}, msg", msg);

        match msg {
            ws::Message::Text(text) => {
                let msg = text.trim();

                if msg.starts_with('/') {
                    let mut command = msg.splitn(2, ' ');

                    match command.next() {
                        Some("/join") => {
                            if let Some(room_name) = command.next() {
                                self.join_room(room_name, ctx);
                            } else {
                                ctx.text("Room name required");
                            }
                        },
                        _ => ctx.text(format!("Unknwon command"))
                    }

                    return
                }

                self.send_msg(msg);
            }
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            _ => {}
        }
    }
}