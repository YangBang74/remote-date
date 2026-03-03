use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RegisterDto {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterCheckDto {
    pub email: String,
    pub code: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginDto {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterResponse {
    pub message: String,
    pub email: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterCheckResponse {
    pub message: String,
    pub user_id: String,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub message: String,
    pub user_id: String,
    pub email: String,
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Deserialize)]
pub struct RefreshTokenRequest {
    pub refresh_token: String,
}

#[derive(Debug, Serialize)]
pub struct RefreshTokenResponse {
    pub access_token: String,
    pub refresh_token: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProfileDto {
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub birth_date: Option<String>,
    pub sex: Option<String>,
    pub avatar_url: Option<String>,
}

