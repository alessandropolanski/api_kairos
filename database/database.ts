import { MongoClient } from 'mongodb';

// Configuração da conexão com MongoDB Atlas
const uri = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority';

const client = new MongoClient(uri);
const db = client.db('kairos');

export { db };