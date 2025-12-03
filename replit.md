# MCP Analytics Portal

## Overview

MCP Analytics Portal is an enterprise-grade Multi-Agent Conversational Portal for secure, explainable, and optimized Snowflake data analytics. The application leverages the Model Context Protocol (MCP) to orchestrate specialized AI agents that work together to process natural language queries, generate optimized SQL, enforce security controls, and provide explainable analytics workflows.

The system operates as a conversational interface where users ask questions about their data in natural language, and a coordinated team of AI agents collaborates to produce secure, cost-optimized SQL queries with full auditability and compliance tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and bundler.

**UI Component System**: The application uses shadcn/ui components (based on Radix UI primitives) with a Material Design 3 inspired design system. This choice provides:
- Robust, accessible component primitives from Radix UI
- Customizable styling through Tailwind CSS with CSS variables
- Information-dense layouts suitable for enterprise analytics
- Consistent design tokens defined in the theme system

**Styling Approach**: Tailwind CSS with a custom configuration that extends the base theme with design tokens for colors, spacing, typography, and shadows. The design follows Material Design 3 principles adapted for enterprise analytics, prioritizing data clarity and information hierarchy.

**State Management**: React Query (TanStack Query) handles server state, API requests, and caching. Local component state uses React hooks.

**Routing**: Wouter provides lightweight client-side routing.

**Type Safety**: Full TypeScript implementation with shared types between client and server.

### Backend Architecture

**Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful API with endpoints for:
- Conversation management (CRUD operations)
- Message storage and retrieval
- Workflow step tracking
- Query processing through AI agent orchestration

**AI Integration**: Google Gemini AI (gemini-2.5-flash model) powers the multi-agent system. The architecture defines specialized agent responsibilities:
1. Intent Parsing Agent - extracts query components
2. RAG-Enhanced SQL Generation Agent - generates optimized SQL
3. Access Control & Security Agent - enforces RBAC and data masking
4. SQL Validation & Safety Agent - ensures query safety
5. Cost Optimization Agent - estimates and optimizes query costs
6. Explainability & Compliance Agent - provides transparency
7. Workflow Manager & Memory Agent - maintains conversation history
8. Workflow Graph & Recommendation Agent - suggests next steps

This multi-agent approach provides separation of concerns, specialized expertise, and composable intelligence.

**Session Management**: In-memory storage for development with a structured interface (`IStorage`) that abstracts the persistence layer, allowing easy migration to database-backed storage.

**Development Server**: Vite dev server integration in development mode provides HMR (Hot Module Replacement) and optimized development workflow.

### Data Architecture

**Database**: PostgreSQL via Neon serverless with Drizzle ORM for type-safe database operations.

**Schema Design**: Four main entities:
- `users` - user authentication and identification
- `conversations` - top-level analytics sessions
- `messages` - chat history (user questions and AI responses)
- `workflow_steps` - detailed workflow tracking with SQL, responses, and metadata

The schema uses UUIDs for primary keys and includes timestamps for audit trails. The workflow tracking system maintains full lineage of analytical steps for reproducibility and compliance.

**ORM Choice**: Drizzle ORM provides type-safe database queries with minimal runtime overhead and excellent TypeScript integration. The schema is defined in TypeScript and can be pushed to the database using `drizzle-kit`.

### Security Architecture

**Role-Based Access Control (RBAC)**: The system simulates Snowflake RBAC with different user roles (ANALYST, DATA_ENGINEER, ADMIN) that determine:
- Accessible tables and schemas
- Column-level masking policies
- Row-level security filters
- Query cost limits

**Data Masking**: Sensitive columns (email, phone, SSN) are automatically masked based on user role. The Access Control Agent enforces these policies during SQL generation.

**Query Safety**: The SQL Validation Agent enforces a SELECT-only policy, blocking any data modification operations (DROP, DELETE, INSERT, UPDATE, ALTER). It also adds LIMIT clauses and prevents full table scans.

**Explainability**: Every query execution includes detailed explanations of:
- Applied security policies
- Masked columns and reasons
- Restricted access and justifications
- Cost estimates and optimization suggestions

This transparency ensures compliance with data governance requirements and builds user trust.

### Build and Deployment

**Build Process**: Custom build script (`script/build.ts`) using:
- Vite for client-side bundling
- esbuild for server-side bundling with selective dependency bundling

**Production Optimization**: The build process bundles frequently-used server dependencies to reduce cold start times by minimizing `openat(2)` syscalls. This is particularly important for serverless deployments.

**Environment Configuration**: Environment variables control database connections, API keys, and runtime behavior.

## External Dependencies

### AI Services

**Google Gemini AI**: Primary AI service using the `@google/genai` SDK. The gemini-2.5-flash model is selected for:
- Fast response times suitable for interactive chat
- Strong reasoning capabilities for SQL generation
- Cost-effectiveness for high-volume usage
- Structured output support for agent responses

Configuration requires `GEMINI_API_KEY` environment variable.

### Database Services

**Neon Serverless PostgreSQL**: Cloud-native PostgreSQL via `@neondatabase/serverless` driver. Provides:
- Serverless scaling
- Connection pooling
- Low latency
- Compatibility with edge runtimes

Connection configured via `DATABASE_URL` environment variable.

**Drizzle ORM**: Type-safe ORM with schema-first approach. The migration system (`drizzle-kit`) manages schema changes through the `db:push` command.

### UI Component Libraries

**Radix UI**: Headless, accessible component primitives for complex UI patterns (dialogs, dropdowns, tooltips, etc.). These components provide:
- ARIA-compliant accessibility
- Keyboard navigation
- Focus management
- Customizable styling

**shadcn/ui**: Pre-styled components built on Radix UI primitives, customized for the application's design system.

### Development Tools

**Replit Integration**: Development environment plugins for:
- Runtime error overlay
- Cartographer (dependency visualization)
- Development banner

These are conditionally loaded only in development mode.

### Supporting Libraries

- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **React Query**: Server state management and caching
- **Zod**: Runtime type validation and schema validation
- **wouter**: Lightweight routing
- **date-fns**: Date manipulation and formatting
- **Lucide React**: Icon library