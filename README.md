# Portfolio

A personal portfolio website showcasing design and development work. Built with clean architecture, layered design patterns, and modern web technologies.

## Features

- 🎨 **Project showcase** with dynamic filtering and case studies
- 📝 **Markdown-based content** for easy case study authoring
- 🔒 **Admin interface** for content management with PocketBase auth
- 🎪 **Experimental canvas** for incubating new projects
- 💬 **Real-time chat** feature under `/talk`
- 📱 **Responsive design** optimized for all devices
- 🗄️ **PocketBase backend** for data persistence and file storage

## Tech Stack

- **Frontend**: SvelteKit 2 + Svelte 5 (runes), TypeScript
- **Styling**: Custom CSS with design tokens
- **State Management**: Service layer + reactive stores pattern
- **Database**: PocketBase (SQLite-based, self-hosted)
- **Deployment**: Node.js adapter (any Node.js hosting platform)
- **Package Manager**: pnpm 10.x

## Architecture

This project follows a **layered architecture** for better separation of concerns:

```
Components → Stores → Services → API Client → API Endpoints
              ↓                                    ↓
           UI State                           PocketBase
```

### Key Principles

- **Service Layer**: All API calls go through pure service functions (`src/lib/services.ts`)
- **Reactive Stores**: Manage UI state and reactivity (`src/lib/store.svelte.ts`)
- **Domain Separation**: Utilities organized by domain (markdown, formatting, etc.)
- **Server Utilities**: Centralized via barrel export (`src/lib/server/index.ts`)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+ (specified in `package.json`)
- PocketBase (download from https://pocketbase.io)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd folio

# Install dependencies
pnpm install

# Start PocketBase (in a separate terminal)
./pb/pocketbase serve

# Start development server
pnpm dev
```

The site will be available at `http://localhost:5173`

### Environment Setup

Create a `.env` file:

```bash
# PocketBase connection
PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090

# Admin credentials for PocketBase
PB_ADMIN_EMAIL=your_admin_email
PB_ADMIN_PASSWORD=your_admin_password

# Legacy admin token (optional fallback)
ADMIN_TOKEN=your_secret_admin_token

# IP whitelist for /start admin route (optional)
ADMIN_IP=your_ip_address
```

## Project Structure

```
src/
├── lib/
│   ├── services.ts          # API service layer
│   ├── store.svelte.ts      # Reactive stores (Svelte 5 runes)
│   ├── apiClient.ts         # Enhanced fetch with auth
│   ├── types.ts             # TypeScript interfaces
│   ├── pocketbase-types.ts  # PocketBase collection types
│   ├── markdown.ts          # Markdown parser
│   ├── seo.ts               # SEO utilities
│   ├── theme.svelte.ts      # Theme management
│   ├── components/          # Reusable UI components
│   │   ├── start/          # Admin components
│   │   └── chat/           # Chat components
│   ├── _fx/                # Visual effects
│   └── server/             # Server-side utilities
│       ├── index.ts        # Barrel export
│       ├── pb.ts           # PocketBase client
│       ├── security.server.ts
│       ├── api-utils.server.ts
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
│       └── talk/
├── hooks.server.ts         # Server hooks (auth, IP whitelist, theme)
└── static/                 # Static assets
    ├── assets/
    └── videos/
pb/                         # PocketBase binary and data
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

# Preview production build
pnpm preview
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

### Store Pattern (Svelte 5 Runes)

Stores manage reactive state using `$state` and `$derived`:

```typescript
import { Projects } from '$lib/store.svelte';

// Access reactive state
const allProjects = Projects.all;
const filteredProjects = Projects.selected;

// Trigger actions
await Projects.fetchProjects();
```

### Server Utilities

Server-side utilities are centralized via barrel export:

```typescript
import { withAdmin, respondJson, createPBClient } from '$lib/server';

// Use in API endpoints
export const POST = withAdmin(async ({ request, locals }) => {
  // locals.pb is the authenticated PocketBase client
  const data = await request.json();
  return respondJson({ success: true });
});
```

## Content Management

### Admin Interface

Access the admin dashboard at `/start` (requires auth + IP whitelist):

- Manage projects and case studies
- Upload and organize media
- View real-time content updates

### PocketBase Admin

Access PocketBase admin UI at `http://127.0.0.1:8090/_/`:

- Manage collections (projects, studies, users, messages)
- Configure rules and permissions
- View logs and analytics

### Markdown Content

Case studies support rich markdown with custom syntax:

- Images: `![alt](src)`
- Videos: `!![alt](src)`
- Standard markdown: headings, lists, links, code, etc.

## Deployment

### Any Node.js Platform

```bash
# Build the application
pnpm build

# Start the server
node build
```

Set environment variables:
- `PUBLIC_POCKETBASE_URL` - PocketBase server URL
- `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` - Admin credentials
- `ADMIN_TOKEN` - Legacy admin token (optional)

### PocketBase Hosting

PocketBase can be:
- Self-hosted alongside the Node.js app
- Deployed to a VPS or cloud server
- Run as a systemd service for production

## Design System

The project supports multiple sub-projects under `/(canvas)`:

- **Shared design tokens**: Define once in root `app.css`
- **Component library**: Reusable components in `src/lib/components`
- **Layout inheritance**: Canvas layout for experimental projects
- **Isolated routing**: Each canvas project is self-contained

## License

See [LICENSE](LICENSE) file.
