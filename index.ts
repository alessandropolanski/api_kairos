import express, { Application } from 'express';
import cors from 'cors';
import { connectToMongoDB } from './database/mongodb.config';
import routes from './routes/index';

const app: Application = express();

// Configuração do CORS
app.use(cors({
    origin: '*', // Em produção, você deve especificar os domínios permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(routes);
app.use('/api', routes)

const port = process.env.PORT || 3001;

const startServer = async () => {
    try {
        await connectToMongoDB();
        app.listen(port, () => {
            console.log(`Servidor rodando na porta ${port}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
};

startServer();
