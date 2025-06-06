import { Schema, model, InferSchemaType, HydratedDocument, Types } from 'mongoose';
import uuid4 from 'uuid4';

// 1) Schema
export const teamSchema = new Schema({
  id: { type: String, required: true, unique: true, default: uuid4 },
  name: { type: String, required: true },
  active: { type: Boolean, default: true },
  users: [{ type: Types.ObjectId, ref: 'User' }],
  managers: [{ type: Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastModifiedBy: { type: String, required: true }
});

// 2) Tipos inferidos
export type Team = InferSchemaType<typeof teamSchema>;
export type TeamDoc = HydratedDocument<Team>;

// 3) Model
export const TeamModel = model<Team>('Team', teamSchema);