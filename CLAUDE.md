# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sambright Investment CRM** is a React + TypeScript Single Page Application for managing an art/painting business. It uses Supabase as the backend (PostgreSQL database + Auth + API) and features comprehensive inventory management, client tracking, order processing, and an AI-powered color advisor.

## Technology Stack

- **Frontend**: React 18.3.1, TypeScript, Vite 6.3.5
- **UI**: Radix UI components, Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Server Framework**: Hono (for Supabase Edge Functions)
- **Additional**: React Hook Form, Recharts, Lucide React, OpenRouter API

## Common Commands

### Development
```bash
npm run dev          # Start development server on port 3000
```

### Production
```bash
npm run build        # Build for production (output to dist/)
```

### Environment Setup
```bash
cp .env.example .env.local  # Copy environment template
# Edit .env.local with your Supabase credentials
```

Required environment variables:
- `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- `VITE_OPENROUTER_API_KEY` - OpenRouter API key (for AI features)

## Application Architecture

### Core Structure

The application follows a component-based architecture with context-based state management:

```
src/
├── components/          # Feature-specific components
│   ├── ui/             # Reusable Radix UI primitives
│   ├── DashboardOverview.tsx
│   ├── ProductsManager.tsx
│   ├── ClientsManager.tsx
│   ├── SuppliersManager.tsx
│   ├── OrdersManager.tsx
│   ├── ProjectsManager.tsx
│   ├── InventoryTransactions.tsx
│   ├── ReportsAnalytics.tsx
│   ├── AIColorAdvisor.tsx
│   └── Login.tsx
├── contexts/           # React contexts
│   ├── AuthContext.tsx  # Authentication & user roles
│   └── ThemeContext.tsx # Dark/light theme
├── utils/              # Utilities
│   ├── supabase/       # Supabase client & config
│   ├── api.ts          # API utilities
│   ├── currency.ts     # Currency formatting
│   └── orderPrintTemplate.ts
└── supabase/functions/ # Edge Functions
    └── server/         # Hono-based server functions
```

### Main Entry Points

- **`src/main.tsx`**: Application bootstrap - renders App with ThemeProvider and AuthProvider
- **`src/App.tsx`**: Main router - handles authentication flow and role-based view rendering

### Key Architectural Patterns

1. **Role-Based Access Control**:
   - `admin` - Full system access
   - `staff` - Operational access
   - `client` - Limited customer portal access

2. **Context-Based State**:
   - `AuthContext` manages user authentication and role
   - `ThemeContext` handles theme switching

3. **Component Organization**:
   - Each business feature has its own component
   - UI built on Radix UI primitives with Tailwind styling
   - Tab-based navigation in main app

4. **API Layer**:
   - Supabase client for direct database operations
   - Edge Functions for server-side logic
   - Auto-generated API from PostgreSQL schema

## Database Schema (Supabase/PostgreSQL)

Core tables structure:

### products
Product catalog (paintings, paints, supplies)
- Key fields: `type`, `sku`, `brand`, `name`, `size`, `color`, `price`, `stock_quantity`, `low_stock_threshold`, `category`, `status`

### clients
Customer management
- Key fields: `names`, `email`, `phone`, `address`, `total_spent`, `purchase_history`

### suppliers
Vendor/supplier management
- Key fields: `company_name`, `contact_person`, `email`, `phone`, `address`, `rating`, `order_history`

### orders
Order processing
- Key fields: `order_number`, `client_id`, `status`, `total_amount`, `items` (JSONB), `shipping_address`, `billing_address`

### inventory_transactions
Stock movement tracking
- Key fields: `transaction_number`, `product_id`, `type` (purchase/sale/adjustment), `quantity`, `reference_type`

Additional tables: `projects`, user authentication via Supabase Auth

## Key Features & Components

### Dashboard (`DashboardOverview.tsx`)
- Auto-refreshing metrics (30-second intervals)
- Real-time alerts for low stock
- Revenue and sales analytics

### Product Management (`ProductsManager.tsx`)
- CRUD operations for products
- Stock level tracking
- Low-stock alerts

### Order Processing (`OrdersManager.tsx`)
- Create and manage orders
- Print order templates
- Order status tracking

### AI Color Advisor (`AIColorAdvisor.tsx`)
- OpenRouter API integration
- AI-powered color recommendations
- Contextual advice based on inventory

### Inventory Management
- Stock level monitoring
- Transaction history
- Automated low-stock alerts

### Reports & Analytics (`ReportsAnalytics.tsx`)
- Business intelligence dashboard
- Recharts-based visualizations
- Revenue and sales reporting

## Development Notes

### Configuration Files

- **`vite.config.ts`**: Vite configuration with React SWC plugin, path aliases (`@` → `./src`)
- **`tsconfig.json`**: TypeScript strict mode enabled
- **`vercel.json`**: SPA deployment configuration for Vercel

### Supabase Integration

- **`src/utils/supabase/client.ts`**: Supabase client instance
- **`src/utils/supabase/info.tsx`**: Project credentials (auto-generated)
- **`supabase/functions/server/`**: Edge Functions using Hono framework

### Styling

- Global styles: `src/index.css`
- Tailwind CSS v4 with custom configuration
- Theme support via `next-themes`

## Deployment

- **Platform**: Vercel (configured in `vercel.json`)
- **Build output**: `dist/` directory
- **Routing**: SPA - all routes redirect to `index.html`
- **Static asset caching**: Configured in vercel.json

## Development Workflow

1. **Setup**: Copy `.env.example` to `.env.local` and configure Supabase credentials
2. **Development**: Run `npm run dev` to start the development server
3. **Database**: Supabase provides auto-generated API from PostgreSQL schema
4. **Building**: Run `npm run build` to create production build
5. **Deploy**: Vercel automatically deploys from main branch

## Important Considerations

- No test scripts defined in package.json
- No linting configuration present
- Database schema changes should be applied via Supabase migrations
- Edge Functions use Hono framework (not Express)
- All routes are client-side handled (SPA)
- Real-time features use Supabase subscriptions
- Authentication handled via Supabase Auth
- Environment variables must be prefixed with `VITE_` to be accessible in client code
