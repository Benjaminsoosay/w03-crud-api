const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'W03 CRUD API - Items & Categories',
    description: `
REST API built for W03 Project.

Features:
- Full CRUD operations (GET, POST, PUT, DELETE)
- MongoDB integration
- Input validation middleware
- Error handling for all routes
- Two collections: Items and Categories
- Prepared for OAuth authentication (Week 04)
    `,
    version: '1.0.0',
    contact: {
      name: 'Your Name',
      email: 'you@example.com'
    }
  },

  host: 'localhost:8083',
  schemes: ['http'],

  basePath: '/',

  consumes: ['application/json'],
  produces: ['application/json'],

  tags: [
    {
      name: 'items',
      description: 'Full CRUD for Items collection (7+ fields with validation + error handling)'
    },
    {
      name: 'categories',
      description: 'CRUD for Categories collection'
    }
  ],


  // SECURITY (OAuth prep)
  
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'Enter: Bearer <token>'
    }
  },

  security: [
    {
      bearerAuth: []
    }
  ],

  definitions: {
    
    // ITEM (7+ fields required)
    
    Item: {
      _id: 'string (ObjectId)',
      name: 'string',
      description: 'string',
      price: 0,
      category: 'string',
      inStock: true,
      sku: 'string',
      weight: 0,
      manufacturer: 'string',
      createdAt: 'date',
      updatedAt: 'date'
    },

    ItemInput: {
      name: 'string (required)',
      description: 'string (required)',
      price: 0,
      category: 'string (required)',
      inStock: true,
      sku: 'string (required)',
      weight: 0,
      manufacturer: 'string (required)'
    },

    ItemUpdate: {
      name: 'string',
      description: 'string',
      price: 0,
      category: 'string',
      inStock: true,
      sku: 'string',
      weight: 0,
      manufacturer: 'string'
    },

    Category: {
      _id: 'string (ObjectId)',
      name: 'string'
    },

    CategoryInput: {
      name: 'string (required)'
    },

    ErrorResponse: {
      error: 'string',
      message: 'string',
      statusCode: 500
    },

    ValidationError: {
      error: 'Validation failed',
      details: 'object',
      statusCode: 412
    },

    NotFoundError: {
      error: 'Resource not found',
      statusCode: 404
    },

    UnauthorizedError: {
      error: 'Unauthorized',
      statusCode: 401
    }
  }
};

const outputFile = './swagger.json';

const endpointsFiles = [
  './routes/items.js',
  './routes/categories.js'
];

swaggerAutogen(outputFile, endpointsFiles, doc);