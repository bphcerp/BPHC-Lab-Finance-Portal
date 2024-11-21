import express, {Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser'

import userRoutes from './routes/user';
import projectRoutes from './routes/project';
import expenseRoutes from './routes/expense';
import categoryRoutes from './routes/category';
import reimburseRoutes from './routes/reimburse';
import memberRoutes from './routes/member';
import accountRoutes from './routes/account';
import { authenticateToken } from './middleware/authenticateToken';

dotenv.config();

const interval = 30000;

function keepAlive() {
  fetch(process.env.BASE_URL!)
    .then((response) => {
      console.log(`Pinged at ${new Date().toISOString()}: Status Code ${response.status}`);
    })
    .catch((error) => {
      console.error(`Error pinging at ${new Date().toISOString()}:, ${error.message}`);
    });
}

setInterval(keepAlive, interval)

const app = express()
const PORT = process.env.PORT!

mongoose.connect(process.env.DB_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_URL!,
  exposedHeaders: ['Content-Disposition'],
  credentials: true // Allow cookies to be sent
}))

app.use('/api/user', userRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/reimburse', reimburseRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/account', accountRoutes);

app.use(express.static("public"))

app.get('/api', (req: Request, res: Response) => {
  res.send('Welcome to LAMBDA LAB ERP API')
});

app.get('/api/check-auth',authenticateToken, (req: Request, res: Response) => {
  res.send('Welcome to LAMBDA LAB ERP API (Authenticated)')
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
});
