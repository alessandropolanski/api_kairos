import { NOMEM } from "dns";
import { Schema, model } from "mongoose";

export interface IUser extends Document {
    email: string;
    name?: string;
    avatar?: string;
  }
  
  const userSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: String,
    avatar: String,
  });
  
  export const User = model<IUser>('User', userSchema);

// Precisa atualizar esse schema para refletir os dados necessários
// id 
// pki 
// name 
// email
// password
// active
// role
// createdAt
// updatedAt
// lastModifiedBy
