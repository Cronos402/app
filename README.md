# Cronos402 Web App

Main web application for Cronos402 - the MCP payment gateway for Cronos blockchain.

## Features

- Server registration and management dashboard
- Wallet connection and authentication
- Payment analytics and usage tracking
- Developer tools and integration guides

## Development

```bash
pnpm dev
```

Runs on http://localhost:3002

## Stack

- Next.js 15 with Turbopack
- Drizzle ORM with PostgreSQL
- Better Auth for authentication
- Tailwind CSS + shadcn/ui

## Database

```bash
# Apply schema changes
pnpm db:apply-changes

# Open Drizzle Studio
pnpm db:studio
```

## Environment Variables

See `.env.example` for required configuration.
