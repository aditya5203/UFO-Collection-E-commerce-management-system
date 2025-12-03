# UFO Collection Server

Backend server for UFO Collection application built with Express.js and TypeScript.

## Project Structure

```
server/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/                # Configuration files
│   ├── routes/                # API routes
│   ├── middleware/            # Custom middleware
│   ├── models/                # Data models/interfaces
│   ├── services/              # Shared services
│   ├── utils/                 # Utility functions
│   └── modules/               # Feature modules
│       └── auth/              # Authentication module
│           ├── controllers/   # Auth controllers
│           ├── routes/        # Auth routes
│           ├── services/      # Auth services
│           ├── middleware/    # Auth middleware
│           └── types/         # Auth types/interfaces
├── dist/                      # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── .env.example
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - `PORT` - Server port (default: 3000)
   - `NODE_ENV` - Environment (development/production)
   - `MONGO_URL` - MongoDB connection string (default: mongodb://localhost:27017/ufo-collection)

### Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check without emitting files

## API Documentation

### Swagger UI

The API documentation is available via Swagger UI. Once the server is running, visit:

- **Swagger UI**: `http://localhost:{PORT}/ufo-docs` (The URL will be displayed in the console when the server starts)

The Swagger UI provides:
- Interactive API documentation
- Try-it-out functionality for all endpoints
- Request/response schemas
- Authentication testing

### API Endpoints

#### Health Check
- `GET /health` - Server health check

#### Authentication (to be implemented)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

## Development

The project uses TypeScript for type safety and better developer experience. The folder structure is organized to separate concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Routes**: Define API endpoints
- **Middleware**: Handle cross-cutting concerns (auth, validation, errors)
- **Models**: Define data structures
- **Utils**: Reusable utility functions

## API Documentation with Swagger

This project uses Swagger/OpenAPI for API documentation. The documentation is automatically generated from JSDoc comments in the route files.

### Adding Documentation to New Routes

To document a new endpoint, add Swagger JSDoc comments above the route handler:

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example endpoint
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Success response
 */
router.get('/example', exampleController);
```

### Swagger Configuration

Swagger configuration is located in `src/config/swagger.ts`. You can customize:
- API information (title, version, description)
- Server URLs
- Security schemes
- Common schemas
- Tags

## Next Steps

1. Set up database connection (PostgreSQL, MongoDB, etc.)
2. Implement authentication logic (JWT, sessions, etc.)
3. Add validation middleware (Joi, Yup, class-validator)
4. Set up logging (Winston, Pino)
5. Add testing framework (Jest, Mocha)
6. Configure CI/CD pipeline

