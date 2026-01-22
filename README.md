![Cronos402 Logo](https://raw.githubusercontent.com/Cronos402/assets/main/Cronos402-logo-light.svg)

# Cronos402 Web Dashboard

Developer dashboard for managing API keys, monitoring usage, and configuring payment settings.

Production URL: https://cronos402.dev

## Overview

The Cronos402 Web Dashboard is the central control panel for developers building with the Cronos402 ecosystem. It provides user authentication, API key management, usage analytics, and payment configuration. Developers can register, generate API keys for their applications, monitor tool usage, and manage their account settings through an intuitive web interface.

## Architecture

- **Framework**: Next.js 15 with App Router
- **UI**: React with TailwindCSS and shadcn/ui components
- **Authentication**: Better Auth with email/password and OAuth
- **Database**: Drizzle ORM with PostgreSQL
- **State Management**: React Server Components + Client Components
- **API**: Next.js API routes for backend operations
- **Deployment**: Vercel-optimized or self-hosted

## Features

- User registration and authentication
- API key generation and management
- Usage analytics and monitoring
- Payment history tracking
- Tool usage statistics
- Account settings management
- Dark/light mode support
- Responsive design for mobile and desktop
- Integration guides and documentation links
- Real-time usage updates

## Quick Start

### Development

```bash
pnpm install
pnpm dev
```

Server runs on `http://localhost:3002`

### Build

```bash
pnpm build
pnpm start
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cronos402

# Better Auth
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3002

# OAuth Providers (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret

# Cronos Network
NEXT_PUBLIC_CRONOS_NETWORK=cronos-testnet
NEXT_PUBLIC_MCP_URL=https://mcp.cronos402.dev

# Analytics (optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## Tech Stack

- **Next.js 15**: React framework with App Router
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Drizzle ORM**: Type-safe database toolkit
- **Better Auth**: Modern authentication solution
- **React Query**: Data fetching and caching
- **Recharts**: Charts and analytics visualizations
- **Zod**: Schema validation

## Database Schema

Core tables managed by Drizzle ORM:

- `users` - User accounts
- `sessions` - Active sessions
- `api_keys` - Generated API keys
- `tool_usage` - Tool call history
- `payments` - Payment transactions
- `notifications` - User notifications

### Migrations

```bash
# Generate migration
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit push

# Open Drizzle Studio
pnpm drizzle-kit studio
```

## Key Features

### API Key Management

- Generate multiple API keys per account
- Set custom names and permissions
- Revoke keys instantly
- View key usage statistics
- Copy keys with one click

### Usage Analytics

- Real-time tool usage tracking
- Payment history visualization
- Cost breakdown by tool
- Usage trends over time
- Export usage data

### Account Settings

- Profile management
- Password reset
- OAuth connections
- Email preferences
- Billing information

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint

# Run type checking
pnpm type-check

# Database operations
pnpm db:generate    # Generate migrations
pnpm db:push        # Apply migrations
pnpm db:studio      # Open Drizzle Studio
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configure environment variables in Vercel dashboard.

### Self-Hosted

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3002
CMD ["pnpm", "start"]
```

### Production Requirements

- PostgreSQL database
- HTTPS endpoint
- Better Auth secret configured
- OAuth providers set up (optional)
- Analytics configured (optional)

## Project Structure

```
app/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (auth)/       # Authentication pages
│   │   ├── (dashboard)/  # Dashboard pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── custom-ui/    # Custom components
│   ├── lib/              # Utilities and configs
│   │   ├── auth/         # Better Auth config
│   │   └── db/           # Drizzle schemas
│   └── styles/           # Global styles
├── public/               # Static assets
└── drizzle/              # Database migrations
```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### API Keys
- `GET /api/keys` - List user's API keys
- `POST /api/keys` - Generate new API key
- `DELETE /api/keys/:id` - Revoke API key

### Usage
- `GET /api/usage` - Get usage statistics
- `GET /api/usage/:keyId` - Get key-specific usage

### Payments
- `GET /api/payments` - List payment history
- `GET /api/payments/:id` - Get payment details

## Resources

- **Production**: [cronos402.dev](https://cronos402.dev)
- **Documentation**: [docs.cronos402.dev](https://docs.cronos402.dev)
- **SDK**: [npmjs.com/package/cronos402](https://www.npmjs.com/package/cronos402)
- **GitHub**: [github.com/Cronos402/app](https://github.com/Cronos402/app)

## License

MIT
