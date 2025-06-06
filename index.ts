import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes/index';
import mongoose from 'mongoose';
import { sessionMiddleware } from './middleware/validSession';

const app: Application = express();

// Configuração do CORS
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(sessionMiddleware);
app.use(routes);
app.use('/api', routes)

const port = process.env.PORT || 3001;

const startServer = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27018/kairos');
        console.log('Conectado ao MongoDB via Mongoose na porta 27018');
        
        app.listen(port, () => {
            console.log(`Servidor rodando na porta ${port}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    }
};

startServer();
