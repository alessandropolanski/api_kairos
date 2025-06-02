import { connectToMongoDB, closeConnection } from './mongodb.config';

export async function testConnection() {
    try {
        const db = await connectToMongoDB();
        
        // Testa a conexão criando uma coleção de teste
        const testCollection = db.collection('test');
        await testCollection.insertOne({ test: 'conexão', timestamp: new Date() });
        
        console.log('Teste de conexão bem sucedido!');
        
        // Limpa a coleção de teste
        await testCollection.deleteMany({});
        
    } catch (error) {
        console.error('Erro no teste de conexão:', error);
    } finally {
        await closeConnection();
    }
}

testConnection(); 