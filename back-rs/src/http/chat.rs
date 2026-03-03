use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};

use crate::chat::service::ChatService;
use crate::config::AppContext;

/// Router for /api/chat endpoints.
pub fn router() -> Router<AppContext> {
    Router::new().route("/:room", get(get_room_messages))
}

async fn get_room_messages(
    State(state): State<AppContext>,
    Path(room): Path<String>,
) -> (axum::http::StatusCode, Json<serde_json::Value>) {
    let store = state.chat_store.read().await;
    let messages = ChatService::get_messages(&store, &room).await;
    (
        axum::http::StatusCode::OK,
        Json(serde_json::to_value(messages).unwrap()),
    )
}


