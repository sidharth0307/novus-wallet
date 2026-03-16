# Novus Wallet

A modern, full-stack fintech ledger application. Novus enables secure peer-to-peer money transfers, smart escrow links for unregistered users, and instant $cashtag routing, all backed by an ACID-compliant database architecture.

## Tech Stack

* **Frontend:** Next.js, React, Tailwind CSS 
* **Backend:** Node.js, Express.js, TypeScript
* **Database & ORM:** PostgreSQL (Supabase), Prisma
* **Caching & Rate Limiting:** Redis (Upstash)
* **Payments & Payouts:** Stripe Connect & Checkout
* **Communications:** Nodemailer (Gmail SMTP)

## Key Features

* **Bulletproof Ledger:** Built on strict database constraints to make double-spending mathematically impossible.
* **Smart Escrow Links:** Send funds securely to unregistered emails. Funds are held in escrow and auto-refunded if unclaimed after 7 days.
* **Universal Routing:** Move money instantly using unique user `$cashtags` or by scanning a generated QR code.
* **Enterprise Security:** Distributed Redis rate-limiting shields the API from brute-force attacks at the network level.

## Monorepo Structure

* `apps/web`: The Next.js frontend application.
* `apps/api`: The Express.js backend API and Prisma database schema.
* `packages`: Shared configuration and types.

## Local Development Setup

### 1. Prerequisites
Ensure you have Node.js installed, along with a Supabase PostgreSQL instance and an Upstash Redis database.

### 2. Environment Variables
You will need to set up two separate environment files.

**Backend (`apps/api/.env`):**
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[password]@db.[id].supabase.co:5432/postgres"

# Authentication
JWT_SECRET="your_secure_random_string"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="[https://your-db-name.upstash.io](https://your-db-name.upstash.io)"
UPSTASH_REDIS_REST_TOKEN="your_token_here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (Nodemailer)
EMAIL_USER="your-email@gmail.com"
EMAIL_APP_PASSWORD="your-16-character-app-password"

# Server
PORT=5000
FRONTEND_URL="http://localhost:3000"

**Frontend (`apps/web/.env.local`):**
\`\`\`env
NEXT_PUBLIC_API_URL="http://localhost:5000"
\`\`\`

### 3. Install Dependencies
Run this from the root of the project to install dependencies for all workspaces:
\`\`\`bash
npm install
\`\`\`

### 4. Database Setup
Navigate to the API directory and push the Prisma schema to your Postgres database:
\`\`\`bash
cd apps/api
npx prisma db push
\`\`\`

### Testing Payments Locally
Since Stripe needs to send webhooks to your local machine:
1. **Install Stripe CLI:** [Follow instructions here](https://stripe.com/docs/stripe-cli)
2. **Login:** `stripe login`
3. **Listen:** Run `stripe listen --forward-to localhost:5000/webhook`
4. **Configure:** Copy the `whsec_...` key from the terminal into your `apps/api/.env` as `STRIPE_WEBHOOK_SECRET`.

### 5. Start the Application
Open two terminal instances:

**Terminal 1 (Backend):**
\`\`\`bash
cd apps/api
npm run dev
\`\`\`

**Terminal 2 (Frontend):**
\`\`\`bash
cd apps/web
npm run dev
\`\`\`
The application will be available at `http://localhost:3000`.

**Financial Infrastructure**
Novus leverages the Stripe ecosystem to handle the heavy lifting of global payments and multi-party money routing.

Stripe Checkout: Seamlessly handles user deposits. The backend verifies payment via checkout.session.completed webhooks before updating the ledger.

Stripe Connect: Enables automated ACH/Direct Deposit payouts to users via Express Accounts.

Smart Escrow: Integrated with Nodemailer to notify recipients of pending funds with secure claim links.