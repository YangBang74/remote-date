use axum::{
    extract::{Path, State},
    routing::get,
    routing::post,
    Json, Router,
};

use crate::config::AppContext;
use crate::rooms::models::CreateRoomDto;
use crate::rooms::service::{RoomService, RoomStore};

/// Router for /api/rooms endpoints.
pub fn router() -> Router<AppContext> {
    Router::new()
        .route("/", post(create_room))
        .route("/:id", get(get_room))
        .route("/:id/state", get(get_room_state))
}

async fn create_room(
    State(state): State<AppContext>,
    Json(dto): Json<CreateRoomDto>,
) -> (axum::http::StatusCode, Json<serde_json::Value>) {
    let mut store = state.room_store.write().await;
    match RoomService::create_room(&mut store, dto) {
        Ok(room) => (
            axum::http::StatusCode::CREATED,
            Json(serde_json::to_value(room).unwrap()),
        ),
        Err(err) => (
            axum::http::StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        ),
    }
}

async fn get_room(
    State(state): State<AppContext>,
    Path(id): Path<String>,
) -> (axum::http::StatusCode, Json<serde_json::Value>) {
    let store = state.room_store.read().await;
    match RoomService::get_room(&store, &id) {
        Some(room) => (
            axum::http::StatusCode::OK,
            Json(serde_json::to_value(room).unwrap()),
        ),
        None => (
            axum::http::StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Room not found" })),
        ),
    }
}

async fn get_room_state(
    State(state): State<AppContext>,
    Path(id): Path<String>,
) -> (axum::http::StatusCode, Json<serde_json::Value>) {
    let store = state.room_store.read().await;
    match RoomService::get_room_state(&store, &id) {
        Some(state_) => (
            axum::http::StatusCode::OK,
            Json(serde_json::to_value(state_).unwrap()),
        ),
        None => (
            axum::http::StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Room not found" })),
        ),
    }
}


