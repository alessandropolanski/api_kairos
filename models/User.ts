import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

// 1) Schema
export const userSchema = new Schema({
  pki: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  active: { type: Boolean, default: true },
  role: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastModifiedBy: { type: String, required: true }
});

// 2) Tipos inferidos
export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;

// 3) Model
export const UserModel = model<User>('User', userSchema);
