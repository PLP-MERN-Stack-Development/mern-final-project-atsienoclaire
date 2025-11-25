import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Routes
import authRoutes from './routes/auth.js';
import jobRoutes from './routes/jobs.js';
import userRoutes from './routes/users.js';
import applicationRoutes from './routes/applications.js';

dotenv.config();

// ✅ Add environment variable validation here
console.log('🔧 Environment check:');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   JWT_EXPIRE:', process.env.JWT_EXPIRE ? `✅ Set to: ${process.env.JWT_EXPIRE}` : '❌ Missing');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('   PORT:', process.env.PORT ? `✅ Set to: ${process.env.PORT}` : '❌ Missing');

const app = express();

// CORS configuration for production and development
app.use(cors({
  origin: [
    'http://localhost:3000', // Local development
    'http://localhost:5173', // Vite development server
    'https://mern-final-project-atsienoclaire.vercel.app/', // Your Vercel frontend
    'https://mern-final-project-atsienoclaire-2.onrender.com' // Your Render backend (for API calls between services)
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Handle preflight requests
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Basic route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Youth Employment Platform API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youth-employment';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for:`);
  console.log(`   - http://localhost:3000`);
  console.log(`   - http://localhost:5173`);
  console.log(`   - https://mern-final-project-atsienoclaire.vercel.app/`);
  console.log(`   - https://mern-final-project-atsienoclaire-2.onrender.com`);
});