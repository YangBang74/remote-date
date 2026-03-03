export interface RegisterDto {
  email: string
  password: string
}

export interface RegisterCheckDto {
  email: string
  code: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  password: string
  createdAt: Date
  verified: boolean
  firstName?: string
  lastName?: string
  birthDate?: Date
  sex?: 'male' | 'female' | 'other'
  avatarUrl?: string
}

export interface RegisterCheckResult {
  message: string
  userId: string
  accessToken: string
  refreshToken: string
}

export interface VerificationCode {
  email: string
  code: string
  expiresAt: Date
}

export interface UpdateProfileDto {
  firstName?: string
  lastName?: string
  birthDate?: string
  sex?: 'male' | 'female' | 'other'
  avatarUrl?: string
}
