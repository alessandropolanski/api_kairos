import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
    pki: string;
    name: string;
    email: string;
    password: string;
    active: boolean;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    lastModifiedBy: string;
}

const userSchema = new Schema<IUser>({
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

export const User = model<IUser>('User', userSchema);
