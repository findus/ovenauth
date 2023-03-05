use std::collections::HashMap;
use crate::chatmessages::*;
use actix::prelude::*;
use actix_broker::BrokerSubscribe;
use itertools::Itertools;
use log::info;
use serde_json::json;
use serde::{Deserialize, Serialize};

type Client = Recipient<ChatMessage>;
type Room = HashMap<String, Client>;

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

    fn add_client_to_room(&mut self, room_name: &str, id: String, client: Client) -> String {
        let mut id = format!("{}", &id);

        if let Some(room) = self.stream_rooms.get_mut(room_name) {
            /*loop {
                if room.contains_key(&id) {
                    id = id;
                } else {
                    break;
                }
            }*/

            room.insert(id.clone(), client);
            return id;
        }

        let mut room: Room = HashMap::new();

        room.insert(id.clone(), client);
        self.stream_rooms.insert(room_name.to_owned(), room);

        id
    }

    fn send_message(&mut self, room_name: &str, msg: &str, _src: &String) -> Option<()> {
        let mut room = self.take_room(room_name)?;

        for (id, client) in room.drain() {
            if client.try_send(ChatMessage(msg.to_owned())).is_ok() {
                self.add_client_to_room(room_name, id, client);
            }
        }

        Some(())
    }

    fn send_viewer_state_to_room(&mut self, room_name: &String, id: &String) {
        let e = ViewerResponse { viewers: self.stream_rooms.get(room_name).unwrap().keys().map(|e| e.into()).collect::<Vec<String>>() };
        self.send_message(&room_name, &format!("VIEWERS {}", &serde_json::to_string(&e).unwrap()), &id);
    }
}

impl Actor for ChatServer {
    type Context = Context<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.subscribe_system_async::<LeaveRoom>(ctx);
        self.subscribe_system_async::<SendMessage>(ctx);
    }
}

#[derive(Deserialize, Serialize)]
struct ViewerResponse {
    viewers: Vec<String>
}

impl Handler<JoinRoom> for ChatServer {
    type Result = MessageResult<JoinRoom>;

    fn handle(&mut self, msg: JoinRoom, _ctx: &mut Self::Context) -> Self::Result {
        let JoinRoom(room_name, client_name, client) = msg;

        let client_name =  client_name.unwrap_or(format!("{}_{}", rand::random::<usize>() , "Uwe".to_string()));

        let id = self.add_client_to_room(&room_name, client_name.clone(), client);

        let join_msg = format!(
            "USERUPDATE {} joined",
            client_name
        );

        self.send_viewer_state_to_room(&room_name, &id);
        self.send_message(&room_name, &join_msg, &id);
        MessageResult(id)
    }
}

impl Handler<LeaveRoom> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: LeaveRoom, _ctx: &mut Self::Context) -> Self::Result {
        let LeaveRoom(room_name, client_name) = msg;
        if let Some(room) = self.stream_rooms.get_mut(&room_name) {
            room.remove(&client_name);
            let part_msg = format!("USERUPDATE {} left", client_name);
            self.send_viewer_state_to_room(&room_name, &client_name);
            self.send_message(&room_name, &part_msg, &client_name);
        }
    }
}

impl Handler<SendMessage> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: SendMessage, _ctx: &mut Self::Context) -> Self::Result {
        let SendMessage(room_name, id, msg) = msg;
        self.send_message(&room_name, &format!("MESSAGE {}",msg), &id);
    }
}


impl SystemService for ChatServer {}
impl Supervised for ChatServer {}
