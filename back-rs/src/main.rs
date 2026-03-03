use std::net::SocketAddr;

use axum::{routing::get, Router};
use dotenvy::dotenv;
use tokio::net::TcpListener;
use tokio::sync::RwLock;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod auth;
mod chat;
mod rooms;
mod soundcloud;
mod ws;
mod http;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env and initialize logging
    dotenv().ok();
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "back_rs=debug,axum=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let settings = config::Settings::from_env();

    if settings.mongo_url.is_none() {
        tracing::warn!("MongoDB URL not provided, backend will run without a database (in-memory only)");
    }

    let app_state = config::AppContext {
        settings: settings.clone(),
        auth_store: std::sync::Arc::new(RwLock::new(auth::AuthStore::new())),
        room_store: std::sync::Arc::new(RwLock::new(rooms::service::RoomStore::new())),
        chat_store: std::sync::Arc::new(RwLock::new(chat::service::ChatStore::new())),
    };

    let app: Router<_> = http::build_router()
        .route("/ws", get(ws::ws_handler))
        .with_state(app_state);

    let addr: SocketAddr = format!("0.0.0.0:{}", settings.port).parse()?;
    tracing::info!("🚀 Rust backend listening on {}", addr);

    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
