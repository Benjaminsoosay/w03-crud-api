require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const itemsRoutes = require('./routes/items');
const categoriesRoutes = require('./routes/categories');

const app = express();
const port = process.env.PORT || 8083;

// ========================
// Global Error Handling
// ========================
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// ========================
// Middleware
// ========================
app.use(express.json());

// ========================
// CORS
// ========================
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Z-Key'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );

  if (req.method === 'OPTIONS') return res.sendStatus(200);

  next();
});

// ========================
// Root Route
// ========================
app.get('/', (req, res) => {
  res.json({
    message: 'W03 CRUD API is running',
    status: 'OK',
    documentation: '/api-docs'
  });
});

// ========================
// Swagger Docs
// ========================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ========================
// MongoDB Connection
// ========================
let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    db = client.db();
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    db = null;
  }
};

connectDB();

// ========================
// DB Safety Middleware (NO DUPLICATE VERSION)
// ========================
app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({
      error: 'Database not ready. Try again in a few seconds.'
    });
  }

  req.db = db;
  next();
});

// ========================
// Routes
// ========================
app.use('/items', itemsRoutes);
app.use('/categories', categoriesRoutes);

// ========================
// 404 Handler
// ========================
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========================
// Start Server
// ========================
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📘 Swagger docs: http://localhost:${port}/api-docs`);
});