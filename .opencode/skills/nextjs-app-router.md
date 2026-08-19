---
name: Next.js App Router
description: Architecture rules for Next.js App Router, Server Components, Client Components, route handlers, and cache invalidation.
---

## Server vs Client Components

- Default to Server Components.
- Use `'use client'` only when a component requires:
  - browser APIs,
  - React state,
  - event handlers,
  - effects,
  - interactive form controls.
- Keep Client Components as small and leaf-level as practical.
- Never import database/repository modules into Client Components.
- Never expose server-only environment variables or database connections to the client.

## Data Fetching

- Fetch initial page data in Server Components whenever practical.
- Prefer direct server-side repository/service calls for Server Components rather than making HTTP requests to the application's own API.
- Use Route Handlers for external/client API access and mutations required by the application contract.
- Do not create an internal `fetch('/api/...')` from a Server Component merely to access the same database.

## Dynamic Routes

- Validate dynamic route parameters before using them.
- Treat route parameters as untrusted input.
- Return an appropriate not-found response when the requested resource does not exist.

## Mutations

- Keep business logic outside Route Handlers and React components.
- Route Handlers should call application/service functions.
- After mutations, explicitly refresh or revalidate affected UI where necessary.
- Do not rely on accidental cache behavior.

## Architecture

Prefer:

Route Handler / Server Component
↓
Service / Domain logic
↓
Repository
↓
SQLite

Avoid putting SQL, business rules, and response formatting inside `route.ts`.
