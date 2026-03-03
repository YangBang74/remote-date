use std::collections::HashMap;

use crate::chat::models::ChatMessage;

#[derive(Debug, Default)]
pub struct ChatStore {
    room_messages: HashMap<String, Vec<ChatMessage>>,
}

impl ChatStore {
    pub fn new() -> Self {
        Self::default()
    }
}

pub struct ChatService;

impl ChatService {
    const MAX_MESSAGES_PER_ROOM: usize = 500;

    pub async fn save_message(store: &mut ChatStore, msg: ChatMessage) {
        let list = store.room_messages.entry(msg.room.clone()).or_default();
        list.push(msg);
        if list.len() > Self::MAX_MESSAGES_PER_ROOM {
            list.remove(0);
        }
    }

    pub async fn get_messages(store: &ChatStore, room: &str) -> Vec<ChatMessage> {
        store.room_messages.get(room).cloned().unwrap_or_default()
    }

    pub fn clear_room(store: &mut ChatStore, room: &str) {
        store.room_messages.remove(room);
    }
}

