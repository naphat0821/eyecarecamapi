import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not set.');
  process.exit(1); // Exit the application if URI is missing
}

app.use(express.json());

// app.use(cors());
app.use(cors({
  origin: process.env.CLIENT_URL,
    credentials: true,
}));

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected')
    console.log('DB name:', mongoose.connection.name);
  })
  .catch(err => console.error('MongoDB connection error:', err));

import authRoutes from './routes/auth';
import sessionRoutes from './routes/session';

app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('API is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
