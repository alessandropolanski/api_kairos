import { MongoClient } from 'mongodb';

// Configuração da conexão com MongoDB Docker
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kairos';

const client = new MongoClient(uri);
const db = client.db('kairos');

export { db };