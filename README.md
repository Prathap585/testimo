# Testimo - Testimonial Collection & Management Platform

A comprehensive testimonial collection and management platform built with React, Express.js, and PostgreSQL. Testimo allows users to create projects, manage client relationships, collect testimonials through public forms, and display testimonials publicly with embeddable widgets.

## 🚀 Features

### Core Automation
- **Set & Forget Workflow** - Mark client work complete → automatic testimonial request → automated follow-ups until received
- **Smart Reminder System** - Intelligent scheduling with quiet hours, timezone support, and recurring reminders
- **Work Status Tracking** - Three-stage workflow: Pending → In Progress → Completed
- **Automatic Triggering** - Testimonial requests sent instantly when work is marked complete

### Testimonial Management
- **Project Organization** - Create and manage multiple testimonial collection campaigns
- **Client Management** - Add clients, track work status, and monitor testimonial collection
- **Approval Workflow** - Review and approve testimonials before publishing
- **Overall Testimonial Wall** - Unified view of all testimonials across projects with embeddable widgets
- **Public Display** - Beautiful testimonial walls for individual projects and overall collection

### Communication & Outreach
- **Email & SMS Outreach** - Send testimonial requests via email and SMS
- **Customizable Templates** - Custom email and SMS templates for client outreach
- **Bulk Operations** - CSV import for client data and bulk testimonial requests

### Technical Features
- **User Authentication** - Secure login with Replit OAuth
- **Embeddable Widgets** - Iframe widgets for external websites with theme and layout options
- **Mobile Optimized** - Responsive design for all devices
- **Real-time Updates** - Live status tracking and notifications

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling
- **shadcn/ui** components (built on Radix UI)
- **TanStack Query** for state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **Express Sessions** with PostgreSQL store
- **Twilio API** for SMS messaging

### Database
- **PostgreSQL** with Neon serverless driver
- **Drizzle Kit** for schema management and migrations

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** database
- **npm** or **yarn** package manager

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd testimo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

**For Local Development**, create a `.env.local` file:

```env
# Essential for local development
REPLIT_DOMAINS=localhost:5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/testimo

# Session Secret (generate a secure random string)
SESSION_SECRET=your-super-secret-session-key

# Replit OAuth (automatically configured on Replit)
REPL_ID=your-replit-app-id
ISSUER_URL=https://replit.com/oidc

# Optional: Twilio SMS (for SMS testimonial requests)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

**Important Notes:**
- `REPLIT_DOMAINS` is automatically provided on Replit but required for local development
- The app automatically detects local development and uses `localhost:5000` if not set
- `REPL_ID` and `ISSUER_URL` are automatically configured on Replit platform

### 4. Database Setup

#### Option A: Using Replit's Built-in Database
If running on Replit, the PostgreSQL database is automatically available via the `DATABASE_URL` environment variable.

#### Option B: Local PostgreSQL Setup
1. Install PostgreSQL locally
2. Create a new database called `testimo`:
   ```sql
   CREATE DATABASE testimo;
   ```
3. Update the `DATABASE_URL` in your `.env` file

### 5. Database Schema Migration

Push the schema to your database:

```bash
npm run db:push
```

If you encounter data-loss warnings, use:

```bash
npm run db:push --force
```

### 6. Start the Development Server

```bash
npm run dev
```

This starts both the backend server and frontend development server on port 5000.

The application will be available at: `http://localhost:5000`

## 📊 Database Schema

### Core Tables

#### `users`
Stores user account information from OAuth authentication.
```sql
- id (varchar, primary key, UUID)
- email (varchar, unique)
- first_name (varchar)
- last_name (varchar)
- profile_image_url (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `projects`
Testimonial collection campaigns created by users.
```sql
- id (varchar, primary key, UUID)
- user_id (varchar, foreign key → users.id)
- name (varchar, not null)
- description (text)
- is_active (boolean, default: true)
- email_settings (jsonb, default template)
- sms_settings (jsonb, default template)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `clients`
Client contacts associated with projects with work status tracking.
```sql
- id (varchar, primary key, UUID)
- project_id (varchar, foreign key → projects.id)
- name (varchar, not null)
- email (varchar, not null)
- phone (varchar, optional)
- company (varchar)
- work_status (enum: 'pending', 'in_progress', 'completed', default: 'pending')
- is_contacted (boolean, default: false)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `testimonials`
Client-submitted testimonials with approval workflow.
```sql
- id (varchar, primary key, UUID)
- project_id (varchar, foreign key → projects.id)
- client_id (varchar, foreign key → clients.id, optional)
- client_name (varchar, not null)
- client_email (varchar, not null)
- client_title (varchar)
- client_company (varchar)
- content (text, not null)
- rating (integer, 1-5 stars)
- is_approved (boolean, default: false)
- is_published (boolean, default: false)
- video_url (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `contact_submissions`
General contact form submissions.
```sql
- id (varchar, primary key, UUID)
- name (varchar, not null)
- email (varchar, not null)
- subject (varchar, not null)
- message (text, not null)
- is_read (boolean, default: false)
- created_at (timestamp)
```

#### `sessions`
Session storage for authentication (required for Replit Auth).
```sql
- sid (varchar, primary key)
- sess (jsonb, not null)
- expire (timestamp, not null)
```

### Relationships

- **Users** → **Projects** (one-to-many)
- **Projects** → **Clients** (one-to-many)
- **Projects** → **Testimonials** (one-to-many)
- **Clients** → **Testimonials** (one-to-many, optional)

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (frontend + backend) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run check` | Run TypeScript type checking |
| `npm run db:push` | Push schema changes to database |

## 🏗 Project Structure

```
testimo/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configs
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app component
│   └── index.html
├── server/                 # Express backend
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── replitAuth.ts      # Authentication setup
│   └── index.ts           # Server entry point
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── package.json
```

## 🌐 API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/login` - Login (redirects to OAuth)
- `POST /api/auth/logout` - Logout

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Clients
- `GET /api/clients` - Get all clients for user
- `GET /api/projects/:id/clients` - Get clients for project
- `POST /api/clients` - Add new client
- `PATCH /api/clients/:id` - Update client (triggers auto-request when work marked complete)
- `DELETE /api/clients/:id` - Delete client
- `POST /api/clients/:id/send-testimonial-request` - Send email request manually
- `POST /api/clients/:id/send-sms-request` - Send SMS request manually

### Testimonials
- `GET /api/testimonials` - Get user's testimonials
- `GET /api/testimonials/wall` - Get testimonial wall for authenticated user
- `GET /api/testimonials/wall/:userId/embed` - Public embeddable testimonial wall
- `GET /api/projects/:id/testimonials` - Get testimonials for project
- `POST /api/testimonials` - Submit new testimonial (public)
- `PATCH /api/testimonials/:id` - Update testimonial (approve/publish)
- `DELETE /api/testimonials/:id` - Delete testimonial

### Public APIs
- `GET /api/testimonials/public` - Get all published testimonials
- `GET /api/projects/:id/testimonials/embed` - Get embeddable testimonials
- `POST /api/contact` - Submit contact form

## 🎨 Customization

### Email & SMS Templates
Projects include customizable email and SMS templates with placeholders:
- `{{projectName}}` - Project name
- `{{clientName}}` - Client name
- `{{testimonialUrl}}` - Unique testimonial submission URL

#### Email Templates
- **Subject**: Customizable email subject line
- **Content**: Rich text email body with HTML support
- **Default**: Professional template requesting testimonials

#### SMS Templates
- **Message**: Text message content (160 character limit recommended)
- **Default**: Concise message with testimonial link
- **Note**: SMS functionality requires Twilio configuration

### Embed Widgets
Testimonials can be embedded on external websites with customization options:
- **Themes**: Light/Dark
- **Layouts**: Grid/List/Compact
- **Limits**: Number of testimonials to display

Example embed code:
```html
<iframe src="https://your-domain.com/embed/project-id?theme=light&layout=grid&limit=6" 
        width="100%" height="600" frameborder="0"></iframe>
```

## 🎯 Key Workflows

### Set & Forget Testimonial Collection
1. **Add Client** - Enter client details and assign to project
2. **Work in Progress** - Update client status to "In Progress"
3. **Mark Complete** - Change status to "Completed" → Automatic testimonial request sent
4. **Automated Follow-ups** - System sends reminders based on project settings until testimonial received
5. **Review & Approve** - Testimonials appear in dashboard for approval
6. **Publish** - Approved testimonials automatically appear on testimonial wall

### Manual Testimonial Requests
- Send individual email or SMS requests anytime
- Schedule custom reminders for specific clients
- Bulk import clients and send batch requests

### Testimonial Wall Management
- View unified testimonial wall across all projects
- Generate embeddable widgets for external websites
- Customize layout, theme, and display limits
- Public sharing without exposing sensitive data

## 🐛 Troubleshooting

### Common Issues

#### `REPLIT_DOMAINS not provided` Error  
**Problem**: Error when running locally
**Solution**: ✅ **FIXED** - The app automatically handles this in development mode. Ensure you have:
```env
NODE_ENV=development
REPLIT_DOMAINS=localhost:5000  # Optional, auto-set if missing
```

#### OAuth/Authentication Errors in Local Development
**Problem**: `ClientError: unexpected HTTP response status code` or OAuth discovery failures
**Solution**: ✅ **FIXED** - The app now automatically:
- Skips OAuth setup when running locally without `REPL_ID`
- Bypasses authentication checks for local development
- Provides helpful messages about authentication being disabled locally

#### Node.js Version Compatibility
**Problem**: `import.meta.dirname` undefined in Node.js v18
**Solution**: Upgrade to **Node.js v20+** for full compatibility. The project requires modern Node.js features.

#### Database Connection Issues
1. Verify `DATABASE_URL` format is correct
2. Ensure PostgreSQL is running locally
3. Run `npm run db:push` to sync schema
4. Use `npm run db:push --force` if there are warnings

#### Authentication Not Working
1. Verify `REPL_ID` matches your Replit app ID
2. Check that `SESSION_SECRET` is set and secure
3. Ensure you're accessing the app via the correct domain

## 📝 Recent Updates

### September 2025 - Major Feature Updates
- ✅ **Set & Forget Workflow**: Complete automation from work completion to testimonial collection
- ✅ **Overall Testimonial Wall**: Unified view with embeddable widgets across all projects
- ✅ **Work Status Tracking**: Three-stage client workflow with automatic triggering
- ✅ **Smart Reminders**: Recurring reminders with timezone and quiet hour support
- ✅ **Local Development Fix**: Complete OAuth and environment compatibility for local development
- ✅ **Node.js v20+ Support**: Full compatibility with modern Node.js features
- ✅ **UI Improvements**: Replaced placeholder content with realistic samples
- ✅ **GitHub Integration**: Full repository setup and deployment guidance

### Technical Improvements
- ✅ **Enhanced Authentication**: Smart environment detection for Replit vs local development
- ✅ **Database Optimizations**: Improved schema with work status and reminder metadata
- ✅ **API Enhancements**: New endpoints for testimonial wall and automated workflows
- ✅ **Mobile Responsiveness**: Improved mobile experience across all pages

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Setup
Ensure the following environment variables are set in production:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secure session secret
- `NODE_ENV=production`

#### Optional SMS Configuration
For SMS testimonial requests, also configure:
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number (E.164 format)

**Note**: If Twilio credentials are not provided, only email testimonial requests will be available.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the existing issues on GitHub
2. Create a new issue with a detailed description
3. Include steps to reproduce the problem
4. Provide relevant error messages and logs

---

Built with ❤️ using React, Express.js, and PostgreSQL