# Backend Architecture - Think Chef

## 📁 Directory Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── app.config.ts    # Application settings
│   │   ├── auth.config.ts   # JWT & auth configuration
│   │   ├── aws.config.ts    # AWS S3 configuration
│   │   └── database.config.ts # PostgreSQL connection
│   │
│   ├── controllers/         # HTTP request handlers
│   │   ├── auth.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── rating.controller.ts
│   │   ├── recipe.controller.ts
│   │   ├── search.controller.ts
│   │   └── upload.controller.ts
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── cors.middleware.ts      # CORS configuration
│   │   ├── error.middleware.ts     # Error handling
│   │   └── validation.middleware.ts # Request validation
│   │
│   ├── models/              # Database operations
│   │   ├── comment.model.ts
│   │   ├── ingredient.model.ts
│   │   ├── rating.model.ts
│   │   ├── recipe.model.ts
│   │   └── user.model.ts
│   │
│   ├── routes/              # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── comment.routes.ts
│   │   ├── rating.routes.ts
│   │   ├── recipe.routes.ts
│   │   ├── search.routes.ts
│   │   ├── upload.routes.ts
│   │   └── index.ts         # Route aggregator
│   │
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── comment.service.ts
│   │   ├── rating.service.ts
│   │   ├── recipe.service.ts
│   │   └── upload.service.ts
│   │
│   ├── types/               # TypeScript type definitions
│   │   ├── express.d.ts
│   │   ├── recipe.types.ts
│   │   └── user.types.ts
│   │
│   ├── utils/               # Utility functions
│   │   ├── bcrypt.util.ts   # Password hashing
│   │   ├── jwt.util.ts      # JWT operations
│   │   ├── logger.util.ts   # Logging
│   │   └── response.util.ts # API responses
│   │
│   ├── app.ts               # Express app setup
│   └── server.ts            # Server entry point
│
├── migrations/              # Database migrations
├── uploads/                 # Temporary file uploads
├── .env.example            # Environment variables template
├── ecosystem.config.js     # PM2 configuration
├── package.json
└── tsconfig.json
```

## 🏗️ Architecture Layers

### 1. **Config Layer** (`src/config/`)
- Centralized configuration management
- Environment variable loading
- Database connection pooling
- AWS SDK configuration

### 2. **Routes Layer** (`src/routes/`)
- API endpoint definitions
- Route grouping and organization
- Middleware attachment

### 3. **Middleware Layer** (`src/middleware/`)
- Authentication (JWT verification)
- Request validation
- Error handling
- CORS configuration

### 4. **Controllers Layer** (`src/controllers/`)
- HTTP request/response handling
- Input validation
- Calls to service layer
- Response formatting

### 5. **Services Layer** (`src/services/`)
- Business logic implementation
- Transaction management
- Data transformation
- External API calls

### 6. **Models Layer** (`src/models/`)
- Database query builders
- Data access operations
- SQL query management

### 7. **Utils Layer** (`src/utils/`)
- Reusable helper functions
- JWT operations
- Password hashing
- Logging utilities

### 8. **Types Layer** (`src/types/`)
- TypeScript interfaces
- Type definitions
- Extended Express types

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- PostgreSQL database
- AWS account (for S3)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   ```

### Development

```bash
# Run in development mode with auto-reload
npm run dev

# Or with nodemon
npm run dev:watch
```

### Production

```bash
# Build for production
npm run build

# Run production server
npm run prod

# Or use PM2
npm run pm2:start
```

## 📝 Environment Variables

See `.env.example` for all required environment variables:

- **Database:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **JWT:** `JWT_SECRET`, `JWT_EXPIRES_IN`
- **AWS:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`
- **App:** `NODE_ENV`, `PORT`, `CORS_ORIGIN`

## 🔄 Migration from Old Structure

The backend has been restructured from a monolithic `index.ts` file to a clean layered architecture:

**Before:**
- Single 691-line file
- Mixed concerns
- Hardcoded secrets
- MySQL + PostgreSQL confusion

**After:**
- Organized into 7 layers
- Separation of concerns
- Environment-based configuration
- PostgreSQL only
- TypeScript throughout

## 🧪 Testing

```bash
# Test database connection
npm run dev

# Check for TypeScript errors
npx tsc --noEmit
```

## 📦 Key Dependencies

- **express** - Web framework
- **pg** - PostgreSQL client
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **multer** - File uploads
- **aws-sdk** - AWS S3 integration
- **dotenv** - Environment variables

## 🔐 Security Improvements

1. ✅ No hardcoded secrets
2. ✅ Environment-based configuration
3. ✅ JWT token verification middleware
4. ✅ Password hashing with bcrypt
5. ✅ Input validation middleware
6. ✅ Proper error handling
7. ✅ CORS configuration

## 🎯 Next Steps

1. Add unit tests for services
2. Add integration tests for API endpoints
3. Implement rate limiting
4. Add API documentation (Swagger/OpenAPI)
5. Set up CI/CD pipeline
6. Add monitoring and logging (Winston, Sentry)
7. Consider microservices migration when scaling
