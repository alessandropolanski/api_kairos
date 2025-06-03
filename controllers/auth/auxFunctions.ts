const bcrypt = require('bcrypt');
import uuid4  from 'uuid4';

const saltRounds = 10;

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

export const generateUUID = () => {
  const id = uuid4()
  return id
};