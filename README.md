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
pnpm install
pnpm dev
```

## Environment Variables

Create a `.env` file:

```
RHIZOME_NODE_URL=http://localhost:3001
PORT=3000
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

