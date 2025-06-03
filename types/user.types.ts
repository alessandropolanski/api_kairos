import { Schema, model, InferSchemaType } from 'mongoose';

// Define o Schema
const userSchema = new Schema({
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

// Infere o tipo automaticamente
type User = InferSchemaType<typeof userSchema>;

// Cria o Model
export const UserModel = model<User>('User', userSchema);
