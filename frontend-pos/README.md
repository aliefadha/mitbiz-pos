# Frontend POS

Point of Sale frontend application built with React, TanStack Router, and Tailwind CSS.

## Prerequisites

- Node.js (v20+)
- Backend server running (see `../backend-pos/README.md`)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your API endpoint
```

### 3. Start Development Server

```bash
npm run dev
```

App will be available at `http://localhost:3000`

## Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Check and auto-fix issues
npm run check
```

## Tech Stack

- **Framework**: React 19 + Vite
- **Router**: TanStack Router (file-based routing)
- **State Management**: TanStack Query (server state)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Forms**: TanStack Form + React Hook Form
- **Validation**: Zod
- **Authentication**: Better Auth
- **Charts**: Recharts
- **Icons**: Lucide React + Tabler Icons
- **Testing**: Vitest + Testing Library
- **Linting**: Biome

## Project Structure

```
frontend-pos/
├── src/
│   ├── routes/          # TanStack Router file-based routes
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration
```

## Routing

This project uses TanStack Router with file-based routing. Routes are defined in `src/routes/`:

- `index.tsx` → `/`
- `about.tsx` → `/about`
- `dashboard/index.tsx` → `/dashboard`
- `__root.tsx` → Layout wrapper (appears on all pages)

### Creating New Routes

Simply add a new file to `src/routes/`. TanStack Router will automatically generate the route configuration.

```tsx
// src/routes/products.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products')({
  component: ProductsComponent,
})

function ProductsComponent() {
  return <div>Products Page</div>
}
```

## API Integration

Uses TanStack Query for server state management. Example:

```tsx
import { useQuery } from '@tanstack/react-query'

function Products() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then(res => res.json())
  })
  
  if (isLoading) return <div>Loading...</div>
  return <ProductList products={data} />
}
```

## Development Tools

- **React Query Devtools**: `Ctrl/Cmd + Shift + Q`
- **Router Devtools**: Included in development mode
- **Vite HMR**: Instant updates on file changes

## Backend Connection

Ensure the backend is running before starting the frontend. Default backend URL:
- Development: `http://localhost:3001` (or your configured port)
