import { NOMEM } from "dns";
import { Schema, model } from "mongoose";

export interface IUser extends Document {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  }
  
  const userSchema = new Schema<IUser>({
    id: {type:String, required: true, unique: true},
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
