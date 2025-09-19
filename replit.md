# Overview

Testimo is a testimonial collection and management platform built with a modern full-stack architecture. The application allows users to automate the process of collecting testimonials from clients by creating projects, managing client relationships, and displaying testimonials publicly. The system features user authentication through Replit's OAuth system, a PostgreSQL database for data persistence, a React-based frontend with shadcn/ui components, and now includes an overall testimonial wall that showcases testimonials from all user projects in a unified, embeddable view.

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

# Recent Changes

## Overall Testimonial Wall Feature (September 2025)
Added a comprehensive overall testimonial wall feature that allows users to showcase testimonials from all their projects in a unified view:

### Backend Implementation
- **API Endpoint**: `GET /api/testimonials/wall` - Returns all published testimonials for authenticated users across all projects
- **Public Embed API**: `GET /api/testimonials/wall/:userId/embed` - Public embeddable version with security hardening (no email exposure)
- **Query Parameters**: Both endpoints support `theme` (light/dark), `layout` (grid/list/compact), and `limit` (number) customization
- **Security**: Public embed endpoint filters to published testimonials only and omits sensitive user data

### Frontend Implementation
- **Main Page**: `/testimonial-wall` - Authenticated page with full controls and customization options
- **Public Embed**: `/wall/:userId/embed` - Public embeddable version for external websites
- **Navigation Integration**: "Testimonial Wall" link appears in navigation for authenticated users
- **Customization Controls**: Layout selector, theme selector, limit selector, and embed functionality
- **Responsive Design**: Supports grid, list, and compact layout modes with proper mobile responsiveness

### Key Features
- **Unified View**: Aggregates testimonials from all user projects with project badges
- **Embeddable Widget**: Generate iframe embed codes for external websites
- **Preview Functionality**: Preview embed appearance before sharing
- **Empty State Handling**: Graceful handling when no testimonials exist with helpful guidance
- **Security**: Public endpoints do not expose sensitive user information like email addresses

## Automatic Testimonial Collection Workflow (September 2025)
Implemented a complete "set and forget" automated testimonial collection system that triggers when work is marked as completed:

### Backend Implementation
- **Work Status Field**: Added `workStatus` column to clients table with three states: "pending", "in_progress", "completed"
- **Automatic Triggering**: PATCH `/api/clients/:id` route now detects when work status changes to "completed"
- **Immediate Testimonial Sending**: Automatically sends testimonial request when work is marked complete
- **Follow-up Scheduling**: Based on project reminder settings, schedules automatic follow-up reminders
- **Integration**: Uses existing reminder system infrastructure for seamless automation

### Frontend Implementation
- **Work Status Badges**: Client cards display colored status badges (Pending, In Progress, Completed)
- **Status Management**: Dropdown menu allows easy work status updates with appropriate icons
- **Visual Feedback**: Success messages confirm automatic testimonial sending and status changes
- **Seamless Integration**: Works within existing client management interface

### Key Features
- **Automated Workflow**: User adds client → marks work complete → testimonial sent immediately → follow-ups scheduled automatically
- **Manual Override**: Existing manual reminder scheduling still available for pre-completion requests  
- **Project-Based Settings**: Automation respects project-level reminder settings (channels, schedule, quiet hours)
- **Status Tracking**: Clear visual indicators for work progress and testimonial request status
- **Set and Forget**: Complete automation eliminates need for manual follow-up management