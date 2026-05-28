require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Import authentication middleware
const ensureAuthenticated = require('./middleware/auth');

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
// Session Configuration
// ========================
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-random-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ========================
// Passport Initialization
// ========================
app.use(passport.initialize());
app.use(passport.session());

// Serialize/Deserialize user
passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// ========================
// Google OAuth Strategy Only
// ========================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8083/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    console.log('✅ Google Authentication successful:', profile.displayName);
    return done(null, profile);
}));

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
// Auth Routes
// ========================

// Root route - check login status
app.get('/', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({
      status: 'authenticated',
      message: `✅ Logged in as: ${req.user.displayName}`,
      authenticated: true,
      user: {
        id: req.user.id,
        displayName: req.user.displayName,
        email: req.user.emails?.[0]?.value,
        profileUrl: req.user.profileUrl
      },
      protected_endpoints: [
        'POST /items',
        'PUT /items/:id', 
        'DELETE /items/:id',
        'POST /categories',
        'PUT /categories/:id',
        'DELETE /categories/:id'
      ],
      documentation: '/api-docs',
      logout: '/logout'
    });
  } else {
    res.json({
      status: 'unauthenticated',
      message: '❌ Not logged in. Please authenticate to access protected endpoints',
      authenticated: false,
      login_url: '/auth/google',
      documentation: '/api-docs'
    });
  }
});

// Google authentication endpoints
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/api-docs');
  }
);

// Logout endpoint
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
      res.json({ 
        message: '✅ Successfully logged out',
        redirect: '/'
      });
    });
  });
});

// Get current user info
app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        displayName: req.user.displayName,
        email: req.user.emails?.[0]?.value,
        provider: 'google'
      }
    });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

// Test protected route
app.get('/protected-test', ensureAuthenticated, (req, res) => {
  res.json({ 
    message: '🎉 You have successfully accessed a protected route!',
    user: req.user.displayName,
    timestamp: new Date().toISOString()
  });
});

// ========================
// Swagger Docs
// ========================
const swaggerOptions = {
  swaggerOptions: {
    oauth2RedirectUrl: 'https://w03-crud-api-1.onrender.com/api-docs/oauth2-redirect.html',
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

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
// DB Safety Middleware
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
// PUBLIC ROUTES (No authentication required)
// ========================

// GET all items - Public
app.get('/items', async (req, res) => {
  try {
    const items = await db.collection('items').find({}).toArray();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single item by ID - Public
app.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const item = await db.collection('items').findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all categories - Public
app.get('/categories', async (req, res) => {
  try {
    const categories = await db.collection('categories').find({}).toArray();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single category by ID - Public
app.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const category = await db.collection('categories').findOne({ _id: new ObjectId(id) });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================
// PROTECTED ROUTES (Authentication required)
// ========================

// POST create new item - Protected
app.post('/items', ensureAuthenticated, async (req, res) => {
  try {
    const { name, description, price, category } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ 
        error: 'Validation failed: Name and description are required fields' 
      });
    }
    
    const newItem = {
      name,
      description,
      price: price || 0,
      category: category || 'uncategorized',
      createdAt: new Date(),
      createdBy: req.user?.displayName || 'google-user'
    };
    
    const result = await db.collection('items').insertOne(newItem);
    
    res.status(201).json({ 
      message: 'Item created successfully',
      _id: result.insertedId,
      ...newItem 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update item - Protected
app.put('/items/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }
    
    updateData.updatedAt = new Date();
    updateData.updatedBy = req.user?.displayName || 'google-user';
    
    const result = await db.collection('items').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE item - Protected
app.delete('/items/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const result = await db.collection('items').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new category - Protected
app.post('/categories', ensureAuthenticated, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const newCategory = {
      name,
      description: description || '',
      createdAt: new Date(),
      createdBy: req.user?.displayName || 'google-user'
    };
    
    const result = await db.collection('categories').insertOne(newCategory);
    res.status(201).json({ 
      message: 'Category created successfully',
      _id: result.insertedId,
      ...newCategory 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update category - Protected
app.put('/categories/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }
    
    updateData.updatedAt = new Date();
    const result = await db.collection('categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE category - Protected
app.delete('/categories/:id', ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    const result = await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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
  console.log(`🔐 Google Auth: http://localhost:${port}/auth/google`);
  console.log(`✅ Protected routes require authentication`);
  console.log(`📊 Public routes: GET /items, GET /categories`);
  console.log(`🔒 Protected routes: POST, PUT, DELETE on /items and /categories`);
});