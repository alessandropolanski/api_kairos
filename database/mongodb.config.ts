import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'kairos';

let client: MongoClient;
let db: any;

export const connectToMongoDB = async () => {
    try {
        if (!client) {
            client = new MongoClient(MONGODB_URI);
            await client.connect();
            console.log('Conectado ao MongoDB com sucesso!');
        }
        
        if (!db) {
            db = client.db(DB_NAME);
        }
        
        return db;
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        throw error;
    }
};

export const getDb = () => {
    if (!db) {
        throw new Error('Database não inicializada. Chame connectToMongoDB primeiro.');
    }
    return db;
};

export const closeConnection = async () => {
    if (client) {
        await client.close();
        console.log('Conexão com MongoDB fechada.');
    }
};
