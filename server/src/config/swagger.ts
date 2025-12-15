// server/src/config/swagger.ts
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
          name: {
            type: "string",
            example: "Oversized Cotton T-Shirt",
          },
          slug: {
            type: "string",
            example: "oversized-cotton-t-shirt",
          },
          description: {
            type: "string",
            example: "Relaxed fit unisex cotton tee with soft feel.",
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
            enum: ["Active", "Inactive"],
            example: "Active",
          },
          gender: {
            type: "string",
            enum: ["Male", "Female"],
            example: "Male",
          },
          colors: {
            type: "array",
            items: { type: "string", example: "#1f1f1f" },
            example: ["#1f1f1f", "#ffffff"],
          },
          sizes: {
            type: "array",
            items: { type: "string", enum: ["S", "M", "L", "XL", "XXL"] },
            example: ["M", "L", "XL"],
          },
          image: {
            type: "string",
            example:
              "https://res.cloudinary.com/your_cloud_name/image/upload/v1/ufo-collection/products/main.png",
          },
          images: {
            type: "array",
            items: { type: "string" },
            example: [
              "https://res.cloudinary.com/your_cloud_name/image/upload/v1/ufo-collection/products/a.png",
              "https://res.cloudinary.com/your_cloud_name/image/upload/v1/ufo-collection/products/b.png",
            ],
          },
          categoryId: { type: "string", example: "65f1c4b9e3b6f27c0d1a1234" },
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
        required: ["name", "price", "stock", "image", "gender", "colors", "sizes", "categoryId"],
        properties: {
          name: {
            type: "string",
            example: "Chunky Sneakers",
          },
          slug: {
            type: "string",
            example: "chunky-sneakers",
            description: "Optional. If missing, generated from name.",
          },
          description: {
            type: "string",
            example: "Comfortable chunky sneakers for everyday wear.",
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
            enum: ["Active", "Inactive"],
            example: "Active",
          },
          gender: {
            type: "string",
            enum: ["Male", "Female"],
            example: "Male",
          },
          colors: {
            type: "array",
            items: { type: "string", example: "#000000" },
            example: ["#000000", "#ffffff"],
          },
          sizes: {
            type: "array",
            items: { type: "string", enum: ["S", "M", "L", "XL", "XXL"] },
            example: ["M", "L"],
          },
          image: {
            type: "string",
            example:
              "https://res.cloudinary.com/your_cloud_name/image/upload/v1/ufo-collection/products/chunky-sneaker.png",
          },
          images: {
            type: "array",
            items: { type: "string" },
          },

          categoryId: { type: "string", example: "65f1c4b9e3b6f27c0d1a1234" },
        },
      },

      UpdateProductRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: {
            type: "string",
            description: "If omitted but name is provided, backend will regenerate.",
          },
          description: { type: "string" },
          price: { type: "number" },
          stock: { type: "number" },
          status: {
            type: "string",
            enum: ["Active", "Inactive"],
          },
          gender: {
            type: "string",
            enum: ["Male", "Female"],
          },
          colors: {
            type: "array",
            items: { type: "string" },
          },
          sizes: {
            type: "array",
            items: { type: "string", enum: ["S", "M", "L", "XL", "XXL"] },
          },
          image: { type: "string" },
          images: {
            type: "array",
            items: { type: "string" },
          },
          categoryId: { type: "string" },
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
            example:
              "https://res.cloudinary.com/your_cloud_name/image/upload/v1/ufo-collection/categories/hoodie.png",
          },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },

      CreateCategoryRequest: {
        type: "object",
        required: ["name"],
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
            example:
              "https://res.cloudinary.com/your_cloud_name/image/upload/v1/ufo-collection/categories/hoodie.png",
          },
          isActive: { type: "boolean", example: true },
        },
      },

      UpdateCategoryRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          slug: { type: "string" },
          description: { type: "string" },
          imageUrl: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
    },
  },
  tags: [
    { name: "Health", description: "Health check endpoints" },
    { name: "Auth", description: "Authentication endpoints" },
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
      description: "Public category endpoints",
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
