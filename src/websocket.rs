use std::collections::HashMap;
use crate::chatmessages::*;
use actix::prelude::*;
use actix_broker::BrokerSubscribe;

type Client = Recipient<ChatMessage>;
type Room = HashMap<usize, Client>;

#[derive(Default)]
pub struct ChatServer {
    stream_rooms: HashMap<String, Room>,
}

impl ChatServer {

    fn take_room(&mut self, room_name: &str) -> Option<Room> {
        let room = self.stream_rooms.get_mut(room_name)?;
        let room = std::mem::take(room);
        Some(room)
    }

    fn add_client_to_room(&mut self, room_name: &str, id: Option<usize>, client: Client) -> usize {
        let mut id = id.unwrap_or_else(rand::random::<usize>);

        if let Some(room) = self.stream_rooms.get_mut(room_name) {
            loop {
                if room.contains_key(&id) {
                    id = rand::random::<usize>();
                } else {
                    break;
                }
            }

            room.insert(id, client);
            return id;
        }

        let mut room: Room = HashMap::new();

        room.insert(id, client);
        self.stream_rooms.insert(room_name.to_owned(), room);

        id
    }

    fn send_message(&mut self, room_name: &str, msg: &str, _src: usize) -> Option<()> {
        let mut room = self.take_room(room_name)?;

        for (id, client) in room.drain() {
            if client.try_send(ChatMessage(msg.to_owned())).is_ok() {
                self.add_client_to_room(room_name, Some(id), client);
            }
        }

        Some(())
    }
}

impl Actor for ChatServer {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.subscribe_system_async::<LeaveRoom>(ctx);
        self.subscribe_system_async::<SendMessage>(ctx);
    }
}

impl Handler<JoinRoom> for ChatServer {
    type Result = MessageResult<JoinRoom>;

    fn handle(&mut self, msg: JoinRoom, _ctx: &mut Self::Context) -> Self::Result {
        let JoinRoom(room_name, client_name, client) = msg;

        let id = self.add_client_to_room(&room_name, None, client);
        let join_msg = format!(
            "{} joined {}",
            client_name.unwrap_or_else(|| "Uwe".to_string()),
            room_name
        );

        self.send_message(&room_name, &join_msg, id);
        MessageResult(id)
    }
}

impl Handler<LeaveRoom> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveRoom, _ctx: &mut Self::Context) -> Self::Result {
        if let Some(room) = self.stream_rooms.get_mut(&msg.0) {
            room.remove(&msg.1);
        }
    }
}

impl Handler<SendMessage> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: SendMessage, _ctx: &mut Self::Context) -> Self::Result {
        let SendMessage(room_name, id, msg) = msg;
        self.send_message(&room_name, &msg, id);
    }
}


impl SystemService for ChatServer {}
impl Supervised for ChatServer {}
