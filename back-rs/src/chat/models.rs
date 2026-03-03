use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub room: String,
    pub text: String,
    pub author: String,
    pub time: i64,
    pub track_url: Option<String>,
    pub image_url: Option<String>,
}

