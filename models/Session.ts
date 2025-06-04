import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';
import uuid4 from 'uuid4';

// 1) Schema
export const sessionSchema = new Schema({
  userPki: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true, default: () => uuid4() },
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  valid: { type: Boolean, default: true }
});

// 2) Tipos inferidos
export type Session = InferSchemaType<typeof sessionSchema>;
export type SessionDoc = HydratedDocument<Session>;

// 3) Model
export const SessionModel = model<Session>('Session', sessionSchema);