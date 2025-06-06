import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';
import uuid4 from 'uuid4';

export const sessionSchema = new Schema({
  userPki: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true, default: () => uuid4() },
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  valid: { type: Boolean, default: true }
});

export type Session = InferSchemaType<typeof sessionSchema>;
export type SessionDoc = HydratedDocument<Session>;

export const SessionModel = model<Session>('Session', sessionSchema);
