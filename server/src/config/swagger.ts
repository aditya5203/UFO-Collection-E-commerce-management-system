import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'UFO Collection API',
    version: '1.0.0',
    description: 'Backend API documentation for UFO Collection application',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Development server',
    },
    {
      url: 'https://api.ufo-collection.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
        },
      },
      HealthCheck: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'OK',
            enum: ['OK', 'DEGRADED'],
          },
          message: {
            type: 'string',
            example: 'Server and database are running',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          services: {
            type: 'object',
            properties: {
              server: {
                type: 'string',
                example: 'running',
              },
              database: {
                type: 'string',
                example: 'connected',
                enum: ['connected', 'disconnected'],
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'password123',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation successful',
          },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: '123e4567-e89b-12d3-a456-426614174000',
              },
              email: {
                type: 'string',
                example: 'user@example.com',
              },
              name: {
                type: 'string',
                example: 'John Doe',
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          email: {
            type: 'string',
            example: 'user@example.com',
          },
          name: {
            type: 'string',
            example: 'John Doe',
          },
          role: {
            type: 'string',
            example: 'customer',
            enum: ['customer', 'admin', 'superadmin'],
          },
          address: {
            type: 'string',
            example: '123 Main St, City, State',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Health',
      description: 'Health check endpoints',
    },
    {
      name: 'Auth',
      description: 'Authentication endpoints',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/**/*.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);

