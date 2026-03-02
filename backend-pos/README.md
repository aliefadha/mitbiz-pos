# Backend POS

Point of Sale backend API built with NestJS, Drizzle ORM, and PostgreSQL.

## Prerequisites

- Node.js (v20+)
- Docker & Docker Compose

## Quick Start

### 1. Start Infrastructure Services

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** on port `5435`
- **Mailpit** (email testing) on port `8025`

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

Default credentials in docker-compose:
- **Host**: `localhost`
- **Port**: `5435`
- **Database**: `pos_database`
- **User**: `pos_user`
- **Password**: `pos_password`

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Setup

```bash
# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run start:dev
```

API will be available at `http://localhost:3000` (or your configured port).

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migration files from schema changes |
| `npm run db:push` | Push schema changes directly to database |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Drizzle Studio for database management |

## Development

```bash
# Development with hot reload
npm run start:dev

# Build for production
npm run build

# Start production build
npm run start:prod

# Lint code
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker Services

### PostgreSQL
- **Port**: `5435` (maps to container port 5432)
- **Data persists** in Docker volume `postgres_data`

### Mailpit (Email Testing)
- **SMTP Port**: `1025`
- **Web UI**: `http://localhost:8025`

Useful for testing email functionality without sending real emails.

## Tech Stack

- **Framework**: NestJS
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: Better Auth
- **Email**: Nodemailer with Mailpit (dev)
- **Validation**: Zod
- **Linting**: Biome

## API Documentation

Once the server is running, Swagger documentation is available at:
- Swagger UI: `/api`
- Scalar API Reference: `/api/reference`

## Project Structure

```
backend-pos/
├── src/
│   ├── db/              # Database schema and seeds
│   ├── modules/         # Feature modules
│   └── main.ts          # Application entry point
├── docker-compose.yml   # Infrastructure services
└── package.json         # Scripts and dependencies
```
