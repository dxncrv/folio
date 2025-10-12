# Portfolio

A personal portfolio website showcasing design and development work. Built with clean architecture, layered design patterns, and modern web technologies.

## Features

- 🎨 **Project showcase** with dynamic filtering and case studies
- 📝 **Markdown-based content** for easy case study authoring
- 🔒 **Admin interface** for content management with session-based auth
- 🎪 **Experimental canvas** for incubating new projects
- 💬 **Real-time chat** feature under `/talk`
- 📱 **Responsive design** optimized for all devices
- 🚀 **Redis persistence** with JSON fallback for development

## Tech Stack

- **Frontend**: SvelteKit 5 (Svelte 5 runes), TypeScript
- **Styling**: Custom CSS with design tokens
- **State Management**: Service layer + reactive stores pattern
- **Database**: Redis (ioredis) with fallback to JSON
- **Deployment**: Vercel
- **Package Manager**: pnpm 10.x

## Architecture

This project follows a **layered architecture** for better separation of concerns:

```
Components → Stores → Services → API Client → API Endpoints
              ↓                                    ↓
           UI State                          Redis/JSON
```

### Key Principles

- **Service Layer**: All API calls go through pure service functions (`src/lib/services.ts`)
- **Reactive Stores**: Manage UI state and reactivity (`src/lib/store.svelte.ts`)
- **Domain Separation**: Utilities organized by domain (markdown, formatting, etc.)
- **Server Utilities**: Centralized via barrel export (`src/lib/server/index.ts`)

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+ (specified in `package.json`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd folio

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The site will be available at `http://localhost:5173`

### Environment Setup

Create a `.env` file for full functionality:

```bash
# Required for write operations
REDIS_URL=your_redis_connection_string
ADMIN_TOKEN=your_secret_admin_token
```

**Without Redis**: Read operations fall back to `src/lib/projects.json`, but write operations will fail.

## Project Structure

```
src/
├── lib/
│   ├── services.ts          # API service layer
│   ├── store.svelte.ts      # Reactive stores
│   ├── apiClient.ts         # Enhanced fetch with auth
│   ├── types.ts             # TypeScript interfaces
│   ├── markdown.ts          # Markdown parser
│   ├── formatting.ts        # String utilities
│   ├── utils.ts             # General helpers
│   ├── components/          # Reusable UI components
│   │   ├── start/          # Admin components
│   │   └── talk/           # Chat components
│   ├── _fx/                # Visual effects
│   └── server/             # Server-side utilities
│       ├── index.ts        # Barrel export
│       ├── redis.server.ts
│       ├── security.server.ts
│       ├── api-utils.server.ts
│       ├── media-scanner.server.ts
│       └── talk.server.ts
├── routes/
│   ├── (public)/           # Public pages
│   │   ├── about/
│   │   └── projects/
│   ├── (private)/          # Admin interface
│   │   └── start/
│   ├── (canvas)/           # Experimental projects
│   │   └── talk/
│   └── api/                # REST API endpoints
│       ├── projects/
│       ├── case-studies/
│       ├── media/
│       └── talk/
└── static/                 # Static assets
    ├── assets/
    └── videos/
```

## Development

```bash
# Development mode with hot reload
pnpm dev

# Type checking
pnpm check

# Linting and formatting
pnpm lint
pnpm format

# Build for production
pnpm build
```

## Architecture Patterns

### Service Layer Pattern

All API calls are centralized in `src/lib/services.ts`:

```typescript
import { ProjectService } from '$lib/services';

// Fetch all projects
const projects = await ProjectService.fetchAll();

// Create project (with auto auth)
const newProjects = await ProjectService.create(project);
```

### Store Pattern

Stores manage reactive state and delegate to services:

```typescript
import { Projects } from '$lib/store.svelte';

// In component
onMount(() => {
  Projects.fetchProjects(); // Calls ProjectService internally
});
```

## Content Management

### Admin Interface

Access the admin dashboard at `/start` (requires auth):

- Manage projects and case studies
- Upload and organize media
- View real-time content updates

### Authentication

Two methods supported:

1. **Header-based**: Include `x-admin-token` header with `ADMIN_TOKEN` value
2. **Cookie-based**: Session cookie `admin_token` validated against Redis

### Markdown Content

Case studies support rich markdown with custom syntax:

- Images: `![alt](src)`
- Videos: `!![alt](src)`
- Standard markdown: headings, lists, links, code, etc.

## Deployment

### Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

Set environment variables in Vercel dashboard:
- `REDIS_URL`
- `ADMIN_TOKEN`
- `ADMIN_IP` (optional)

### Other Platforms

Compatible with any Node.js hosting platform. Ensure:

1. Node.js 18+ runtime
2. Environment variables are set
3. Build command: `pnpm build`
4. Start command: `node build`

## Design System

The project is designed to support multiple sub-projects under `/(canvas)`:

- **Shared design tokens**: Define once in root `app.css`
- **Component library**: Reusable components in `src/lib/components`
- **Layout inheritance**: Canvas layout for experimental projects
- **Isolated routing**: Each canvas project is self-contained

See "Design System Recommendations" section below for expansion guidelines.

## License

See [LICENSE](LICENSE) file.

---

*Built with ❤️ using SvelteKit 5*