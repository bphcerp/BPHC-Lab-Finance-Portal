import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken';

import userRoutes from './routes/user';
import projectRoutes from './routes/project';

dotenv.config();

const app = express()
const PORT = process.env.PORT!

mongoose.connect(process.env.DB_URI!)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(cookieParser())
app.use(cors({
  origin: process.env.FRONTEND_URL!,
  credentials: true // Allow cookies to be sent
}))

app.use('/api/user', userRoutes);
app.use('/api/project', projectRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!')
});

app.get('/api/check-auth', (req: Request, res: Response) => {
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ authenticated: false, message: 'No token found' });
    return
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY!, (err: any, decoded: any) => {
    if (err || !decoded) {
      res.status(401).json({ authenticated: false, message: 'Invalid or expired token' });
    }
    else res.status(200).json({ authenticated: true, message: 'Valid token'});
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
});
