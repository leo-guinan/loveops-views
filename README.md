# loveops-interface

**Tagline:** "APIs and UI that expose the world model and policy."

This repository provides:
- REST/GraphQL API for front-ends
- Optional reference Web UI (compatibility maps, emotional dashboards)
- Connections to:
  - `loveops-world-model` Rhizome node
  - `loveops-policy` engines

## Structure

```
loveops-interface/
  src/
    server/
      index.ts           // main HTTP server
      routes/
        user.ts
        matches.ts
        coaching.ts
        admin.ts
    services/
      WorldModelService.ts  // wraps Rhizome + views
      PolicyService.ts      // wraps loveops-policy engines
    ui/                     // optional SPA
      components/
        CompatibilityMap.tsx
        EmotionalDashboard.tsx
        MatchList.tsx
      pages/
        UserHome.tsx
        MatchDetail.tsx
  public/
    index.html              // if you ship a simple SPA
```

## Setup

```bash
# Install dependencies
pnpm install

# For development (runs both server and Vite dev server)
pnpm dev

# Or run separately:
# Terminal 1: Backend server
pnpm dev:server

# Terminal 2: Frontend dev server (with hot reload)
pnpm dev:client
```

**Note:** In development, the React app runs on `http://localhost:5173` (Vite dev server) and proxies API calls to `http://localhost:3000`. For production, build everything and run the server:

```bash
# Build everything
pnpm build

# Start production server (serves built React app)
pnpm start
```

**Note:** This repository uses placeholder type definitions for `loveops-policy` and `loveops-world-model` packages. When these packages are available, update the imports in:
- `src/server/index.ts`
- `src/services/WorldModelService.ts`
- `src/services/PolicyService.ts`
- `src/ui/components/*.tsx`
- `src/ui/pages/*.tsx`

Replace imports from `../../types/loveops-*` with the actual package imports.

## Environment Variables

Create a `.env` file:

```
RHIZOME_NODE_URL=http://localhost:3001
PORT=3000
BASE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
```

## Development

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm start` - Run production build

## Docker

### Build the image

```bash
docker build -t loveops-interface .
```

### Run the container

```bash
docker run -p 3000:3000 \
  -e RHIZOME_NODE_URL=http://host.docker.internal:3001 \
  -e PORT=3000 \
  loveops-interface
```

### Using Docker Compose

```bash
# Set environment variables in .env file or export them
export RHIZOME_NODE_URL=http://localhost:3001
export PORT=3000

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

The Dockerfile uses a multi-stage build for optimized production images, installing only production dependencies in the final stage.

