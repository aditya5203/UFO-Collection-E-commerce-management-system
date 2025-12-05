// config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";
import { config } from "./index";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "UFO Collection API",
    version: "1.0.0",
    description: "Backend API documentation for UFO Collection application",
    contact: {
      name: "API Support",
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: "Development server",
    },
    {
      url: "https://api.ufo-collection.com",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "Error message",
          },
        },
      },
      HealthCheck: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "OK",
            enum: ["OK", "DEGRADED"],
          },
          message: {
            type: "string",
            example: "Server and database are running",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T00:00:00.000Z",
          },
          services: {
            type: "object",
            properties: {
              server: {
                type: "string",
                example: "running",
              },
              database: {
                type: "string",
                example: "connected",
                enum: ["connected", "disconnected"],
              },
            },
          },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "password123",
          },
          name: {
            type: "string",
            example: "John Doe",
          },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "user@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "password123",
          },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Operation successful",
          },
          token: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          user: {
            type: "object",
            properties: {
              id: {
                type: "string",
                example: "123e4567-e89b-12d3-a456-426614174000",
              },
              email: {
                type: "string",
                example: "user@example.com",
              },
              name: {
                type: "string",
                example: "John Doe",
              },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: {
            type: "string",
            example: "123e4567-e89b-12d3-a456-426614174000",
          },
          email: {
            type: "string",
            example: "user@example.com",
          },
          name: {
            type: "string",
            example: "John Doe",
          },
          role: {
            type: "string",
            example: "customer",
            enum: ["customer", "admin", "superadmin"],
          },
          address: {
            type: "string",
            example: "123 Main St, City, State",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },

      /* 🔹 PRODUCT SCHEMAS 🔹 */
      Product: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "65f0b5d8c8f4c81234567890",
          },
          sku: {
            type: "string",
            example: "SKU-1001",
          },
          name: {
            type: "string",
            example: "Oversized Cotton T-Shirt",
          },
          description: {
            type: "string",
            example: "Relaxed fit unisex cotton tee with soft feel.",
          },
          category: {
            type: "string",
            example: "T-Shirt",
          },
          price: {
            type: "number",
            example: 1499,
          },
          stock: {
            type: "number",
            example: 120,
          },
          status: {
            type: "string",
            enum: ["Active", "Draft", "Archived"],
            example: "Active",
          },
          image: {
            type: "string",
            example: "/images/products/oversized-tee.png",
          },
          images: {
            type: "array",
            items: { type: "string" },
            example: [
              "/images/products/oversized-tee.png",
              "/images/products/oversized-tee-back.png",
            ],
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      CreateProductRequest: {
        type: "object",
        required: ["sku", "name", "category", "price", "stock", "image"],
        properties: {
          sku: {
            type: "string",
            example: "SKU-2001",
          },
          name: {
            type: "string",
            example: "Chunky Sneakers",
          },
          description: {
            type: "string",
            example: "Comfortable chunky sneakers for everyday wear.",
          },
          category: {
            type: "string",
            example: "Shoes",
          },
          price: {
            type: "number",
            example: 3999,
          },
          stock: {
            type: "number",
            example: 50,
          },
          status: {
            type: "string",
            enum: ["Active", "Draft", "Archived"],
            example: "Active",
          },
          image: {
            type: "string",
            example: "/images/products/chunky-sneaker.png",
          },
          images: {
            type: "array",
            items: { type: "string" },
          },
        },
      },
      UpdateProductRequest: {
        type: "object",
        properties: {
          sku: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
          stock: { type: "number" },
          status: {
            type: "string",
            enum: ["Active", "Draft", "Archived"],
          },
          image: { type: "string" },
          images: {
            type: "array",
            items: { type: "string" },
          },
        },
      },

      /* 🔹 CATEGORY SCHEMAS 🔹 */
      Category: {
        type: "object",
        properties: {
          id: { type: "string", example: "65f1c4b9e3b6f27c0d1a1234" },
          name: { type: "string", example: "Hoodie" },
          slug: { type: "string", example: "hoodie-men-clothes" },
          description: {
            type: "string",
            example: "Warm oversized hoodies",
          },
          imageUrl: {
            type: "string",
            example: "/images/categories/hoodie.png",
          },
          isActive: { type: "boolean", example: true },
          parent: { type: "string", nullable: true },
          mainCategory: {
            type: "string",
            enum: ["Clothes", "Shoes"],
            example: "Clothes",
          },
          customer: {
            type: "string",
            enum: ["Men", "Women", "Boys", "Girls"],
            example: "Men",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateCategoryRequest: {
        type: "object",
        required: ["name", "mainCategory", "customer"],
        properties: {
          name: { type: "string", example: "Hoodie" },
          slug: {
            type: "string",
            example: "hoodie-men-clothes",
            description: "Optional. If missing, generated from name.",
          },
          description: {
            type: "string",
            example: "Warm oversized hoodies",
          },
          imageUrl: {
            type: "string",
            example: "/images/categories/hoodie.png",
          },
          parentId: { type: "string", nullable: true },
          isActive: { type: "boolean", example: true },
          mainCategory: {
            type: "string",
            enum: ["Clothes", "Shoes"],
            example: "Clothes",
          },
          customer: {
            type: "string",
            enum: ["Men", "Women", "Boys", "Girls"],
            example: "Men",
          },
        },
      },
      UpdateCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          imageUrl: { type: "string" },
          parentId: { type: "string", nullable: true },
          isActive: { type: "boolean" },
          mainCategory: {
            type: "string",
            enum: ["Clothes", "Shoes"],
          },
          customer: {
            type: "string",
            enum: ["Men", "Women", "Boys", "Girls"],
          },
        },
      },
    },
  },
  tags: [
    {
      name: "Health",
      description: "Health check endpoints",
    },
    {
      name: "Auth",
      description: "Authentication endpoints",
    },
    {
      name: "Products",
      description: "Public product catalog endpoints (homepage, collection, PDP)",
    },
    {
      name: "Products - Admin",
      description: "Admin product management (CRUD from dashboard)",
    },
    {
      name: "Categories",
      description: "Public category endpoints (filters, dropdowns, etc.)",
    },
    {
      name: "Categories - Admin",
      description: "Admin category management (CRUD from dashboard)",
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ["./src/**/*.ts"], // Path to the API files
};

export const swaggerSpec = swaggerJsdoc(options);
