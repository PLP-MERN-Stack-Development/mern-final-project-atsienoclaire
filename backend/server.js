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

// ✅ Environment variable validation
console.log('🔧 Environment check:');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('   JWT_EXPIRE:', process.env.JWT_EXPIRE ? `✅ Set to: ${process.env.JWT_EXPIRE}` : '❌ Missing');
console.log('   MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('   PORT:', process.env.PORT ? `✅ Set to: ${process.env.PORT}` : '❌ Missing');

// ✅ Generate default JWT secret if missing (for development)
if (!process.env.JWT_SECRET) {
  console.log('⚠️  JWT_SECRET not found, using development default');
  process.env.JWT_SECRET = 'dev-secret-key-change-in-production-' + Date.now();
}

if (!process.env.JWT_EXPIRE) {
  console.log('⚠️  JWT_EXPIRE not found, using default: 30d');
  process.env.JWT_EXPIRE = '30d';
}

const app = express();

// ✅ CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000', // Local development
    'http://localhost:5173', // Vite development server
    'https://mern-final-project-atsienoclaire.vercel.app', // Your Vercel frontend
    'https://mern-final-project-atsienoclaire-2.onrender.com' // Your Render backend
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

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
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Database connection with better error handling
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/youth-employment';
    
    console.log('🔗 Attempting MongoDB connection...');
    
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
      maxPoolSize: 10, // Maximum number of sockets in the connection pool
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // More specific error handling
    if (error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 IP WHITELIST SOLUTION:');
      console.log('   1. Go to MongoDB Atlas Dashboard');
      console.log('   2. Navigate to Network Access');
      console.log('   3. Add IP Address: 0.0.0.0/0');
      console.log('   4. Or add Render-specific IP ranges');
      console.log('   🔗 https://cloud.mongodb.com/v2/#/security/network/');
    } else if (error.name === 'MongoNetworkError') {
      console.log('\n💡 NETWORK SOLUTION:');
      console.log('   Check your MongoDB connection string and network settings');
    }
    
    // Don't exit immediately - let the server start but without DB
    console.log('🔄 Server will start without database connection. Some features may not work.');
    return null;
  }
};

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔌 MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed due to app termination');
  process.exit(0);
});

const PORT = process.env.PORT || 5000;

// Start server with database connection
const startServer = async () => {
  // Connect to database first
  await connectDB();
  
  // Then start the server
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for:`);
    console.log(`   - http://localhost:3000`);
    console.log(`   - http://localhost:5173`);
    console.log(`   - https://mern-final-project-atsienoclaire.vercel.app`);
    console.log(`   - https://mern-final-project-atsienoclaire-2.onrender.com`);
    console.log(`\n📍 Health check: https://mern-final-project-atsienoclaire-2.onrender.com/api/health`);
    console.log(`📍 API status: https://mern-final-project-atsienoclaire-2.onrender.com/api`);
    
    // Warn if database is not connected
    if (mongoose.connection.readyState !== 1) {
      console.log('\n⚠️  WARNING: Database is not connected. Some features will not work.');
      console.log('   Please check MongoDB Atlas IP whitelist settings.');
    }
  });
};

// Start the application
startServer().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;