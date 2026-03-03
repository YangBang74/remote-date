use std::collections::HashMap;

use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Sex {
    Male,
    Female,
    Other,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct User {
    pub id: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub verified: bool,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub birth_date: Option<DateTime<Utc>>,
    pub sex: Option<Sex>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone)]
pub struct RefreshToken {
    pub user_id: String,
    pub token: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct VerificationCode {
    pub email: String,
    pub code: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Default)]
pub struct AuthStore {
    pub users: HashMap<String, User>,
    pub user_ids_by_email: HashMap<String, String>,
    pub refresh_tokens: HashMap<String, RefreshToken>,
    pub verification_codes: HashMap<String, VerificationCode>,
}

impl AuthStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn create_user(
        &mut self,
        email: String,
        password_hash: String,
        verified: bool,
    ) -> User {
        // Remove existing unverified user and its codes if any
        if let Some(existing_id) = self.user_ids_by_email.get(&email).cloned() {
            self.users.remove(&existing_id);
        }

        let id = Uuid::new_v4().to_string();
        let user = User {
            id: id.clone(),
            email: email.clone(),
            password_hash,
            created_at: Utc::now(),
            verified,
            first_name: None,
            last_name: None,
            birth_date: None,
            sex: None,
            avatar_url: None,
        };

        self.user_ids_by_email.insert(email, id.clone());
        self.users.insert(id.clone(), user.clone());

        user
    }

    pub fn get_user_by_email(&self, email: &str) -> Option<&User> {
        self.user_ids_by_email
            .get(email)
            .and_then(|id| self.users.get(id))
    }

    pub fn get_user_by_id(&self, id: &str) -> Option<&User> {
        self.users.get(id)
    }

    pub fn save_verification_code(&mut self, email: String, code: String, minutes: i64) {
        let expires_at = Utc::now() + Duration::minutes(minutes);
        let vc = VerificationCode {
            email: email.clone(),
            code,
            expires_at,
        };
        self.verification_codes.insert(email, vc);
    }

    pub fn take_verification_code(
        &mut self,
        email: &str,
    ) -> Option<VerificationCode> {
        self.verification_codes.remove(email)
    }

    pub fn store_refresh_token(
        &mut self,
        user_id: String,
        token: String,
        days: i64,
    ) -> RefreshToken {
        let expires_at = Utc::now() + Duration::days(days);
        let rt = RefreshToken {
            user_id,
            token: token.clone(),
            expires_at,
        };
        self.refresh_tokens.insert(token, rt.clone());
        rt
    }

    pub fn get_refresh_token(&self, token: &str) -> Option<&RefreshToken> {
        self.refresh_tokens.get(token)
    }

    pub fn delete_refresh_token(&mut self, token: &str) {
        self.refresh_tokens.remove(token);
    }

    pub fn delete_all_refresh_tokens_for_user(&mut self, user_id: &str) {
        self.refresh_tokens
            .retain(|_, rt| rt.user_id != user_id);
    }
}

