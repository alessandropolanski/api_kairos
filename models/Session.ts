import { Schema, model, Document, Types } from "mongoose";

export interface ISession extends Document {
    userId: Types.ObjectId;
    sessionId: string;
    ip: string;
    userAgent: string;
    createdAt: Date;
    expiresAt: Date;
    valid: boolean;
}

const sessionSchema = new Schema<ISession>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, unique: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    valid: { type: Boolean, default: true }
});

export const Session = model<ISession>('Session', sessionSchema);