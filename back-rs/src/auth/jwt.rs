use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};

use crate::config::Settings;

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtPayload {
    #[serde(rename = "userId")]
    pub user_id: String,
    pub email: String,
    exp: usize,
}

pub fn generate_access_token(
    settings: &Settings,
    user_id: String,
    email: String,
) -> anyhow::Result<String> {
    // For simplicity, interpret JWT_EXPIRES_IN as days (like "7d" by default).
    let days: i64 = if let Some(stripped) =
        settings.jwt_expires_in.strip_suffix('d')
    {
        stripped.parse().unwrap_or(7)
    } else {
        7
    };

    let exp = chrono::Utc::now()
        .checked_add_signed(chrono::Duration::days(days))
        .unwrap_or_else(chrono::Utc::now)
        .timestamp() as usize;

    let payload = JwtPayload {
        user_id,
        email,
        exp,
    };

    let token = encode(
        &Header::default(),
        &payload,
        &EncodingKey::from_secret(settings.jwt_secret.as_bytes()),
    )?;

    Ok(token)
}

pub fn verify_token(
    settings: &Settings,
    token: &str,
) -> Option<JwtPayload> {
    let mut validation = Validation::default();
    validation.validate_exp = true;

    decode::<JwtPayload>(
        token,
        &DecodingKey::from_secret(settings.jwt_secret.as_bytes()),
        &validation,
    )
    .ok()
    .map(|data| data.claims)
}

