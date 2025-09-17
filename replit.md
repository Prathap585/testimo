# Overview

Testimo is a testimonial collection and management platform built with a modern full-stack architecture. The application allows users to automate the process of collecting testimonials from clients by creating projects, managing client relationships, and displaying testimonials publicly. The system features user authentication through Replit's OAuth system, a PostgreSQL database for data persistence, and a React-based frontend with shadcn/ui components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing with conditional rendering based on authentication state
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful API with dedicated routes for authentication, projects, clients, testimonials, and contact forms
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple
- **Error Handling**: Centralized error handling middleware with structured error responses

## Database Design
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Core Tables**:
  - `users`: User profiles with OAuth integration
  - `projects`: User-owned testimonial collection campaigns
  - `clients`: Client contacts associated with projects
  - `testimonials`: Client-submitted testimonials with approval workflow
  - `contact_submissions`: Public contact form submissions
  - `sessions`: Session storage for authentication

## Authentication & Authorization
- **Provider**: Replit OAuth using OpenID Connect
- **Strategy**: Passport.js with custom OpenID Connect strategy
- **Session Storage**: PostgreSQL-backed sessions with automatic cleanup
- **Security**: HTTPS-only cookies, CSRF protection, and secure session configuration
- **User Flow**: Automatic user creation/update on login with profile data sync

## Development & Deployment
- **Build System**: Vite for frontend bundling with hot module replacement
- **Production Build**: esbuild for server-side bundling with ESM output
- **Environment**: Replit-optimized with development plugins for enhanced DX
- **Static Assets**: Vite handles frontend assets with proper caching strategies

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Database URL**: Environment variable-based configuration for seamless deployment

## Authentication Services
- **Replit OAuth**: Primary authentication provider using OpenID Connect protocol
- **Session Store**: PostgreSQL-backed session persistence with automatic expiration

## UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Consistent icon library for UI elements

## Development Tools
- **TypeScript**: Full type safety across client, server, and shared code
- **Drizzle Kit**: Database schema management and migration tools
- **Vite Plugins**: Enhanced development experience with error overlays and debugging tools

## Utility Libraries
- **TanStack Query**: Powerful data fetching and caching solution
- **React Hook Form**: Performance-focused form library with validation
- **Zod**: Runtime type validation for API requests and form data
- **date-fns**: Modern date manipulation and formatting utilities