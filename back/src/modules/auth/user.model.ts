import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
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

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: false,
      trim: true,
    },
    lastName: {
      type: String,
      required: false,
      trim: true,
    },
    birthDate: {
      type: Date,
      required: false,
    },
    sex: {
      type: String,
      required: false,
      enum: ['male', 'female', 'other'],
    },
    avatarUrl: {
      type: String,
      required: false,
      trim: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
)

// Индекс для быстрого поиска по email
UserSchema.index({ email: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
