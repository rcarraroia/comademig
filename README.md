# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a8ac0524-0d89-497f-8633-1d556c175807

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a8ac0524-0d89-497f-8633-1d556c175807) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- TanStack Query (React Query)
- Asaas (Payment Gateway)

## Project Structure

### Key Features

- **Authentication System**: User registration and login with Supabase Auth
- **Digital Wallet**: Professional digital identification cards
- **Service Request Module**: Unified system for requesting certificates and regularization services
- **Payment Integration**: PIX and Credit Card payments via Asaas gateway
- **Admin Panel**: Complete management of users, services, and requests
- **Affiliate System**: Referral program with automatic commissions

### Database Structure

#### Main Tables:
- `profiles`: User profiles and authentication data
- `servicos`: Service catalog (certificates, regularization, etc.)
- `servico_exigencias`: Requirements and documents needed per service
- `solicitacoes_servicos`: User service requests with status tracking
- `asaas_cobrancas`: Payment records and transactions

### Service Request Flow

1. **User selects a service** from the catalog
2. **Fills dynamic form** based on service requirements
3. **Uploads required documents**
4. **Proceeds to checkout** (PIX or Credit Card)
5. **Payment processed** via Asaas gateway
6. **Request created** automatically after payment confirmation
7. **Admin reviews** and updates request status
8. **User receives** final document/certificate

### Admin Features

- Service management (create, edit, activate/deactivate)
- Request management (review, approve, reject, deliver)
- User management
- Financial dashboard
- Audit logs

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a8ac0524-0d89-497f-8633-1d556c175807) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
