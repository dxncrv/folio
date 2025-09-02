# Portfolio

A personal portfolio website showcasing design and development work. Built to be fast, accessible, and maintainable.

## Features

- **Project showcase** with dynamic filtering by code/design
- **About section** with interactive tech stack display
- **Contact functionality** with status management
- **Responsive design** optimized for all devices
- **Admin interface** for content management
- **Redis integration** for dynamic content updates

## Tech Stack

- **Frontend**: SvelteKit 5, TypeScript
- **Styling**: Custom CSS with design tokens
- **Database**: Redis (optional, falls back to JSON)
- **Deployment**: Vercel
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

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

For full functionality, create a `.env` file:

```bash
REDIS_URL=your_redis_connection_string
```

Without Redis, the site will use the static `projects.json` file.

## Project Structure

```
src/
├── lib/
│   ├── components/     # Reusable UI components
│   ├── _libfx/        # Visual effects and animations
│   └── config/        # Configuration files
├── routes/
│   ├── (public)/      # Public pages
│   ├── (private)/     # Admin interface
│   └── api/          # API endpoints
└── static/           # Static assets
```

## Development

```bash
# Development mode
pnpm dev

# Type checking
pnpm check

# Linting and formatting
pnpm lint
pnpm format

# Build for production
pnpm build
```

## Deployment

Configured for Vercel deployment with the `@sveltejs/adapter-vercel`. The site automatically deploys from the main branch.

## Content Management

- Projects can be managed through the admin interface at `/start`
- Static content is stored in `src/lib/projects.json`
- Dynamic updates require Redis configuration

---

*A simple portfolio site focused on showcasing work effectively.*