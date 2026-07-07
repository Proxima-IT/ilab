# iLab BD Frontend Web Application

A React, Vite, and Tailwind CSS frontend for the iLab BD public website, student dashboard, and admin panel. The app uses the Laravel backend API, not Supabase.

## Tech Stack

- React 19 and TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios for Laravel API requests
- Lucide React icons
- Framer Motion animations
- React Hook Form and Zod

## Environment Variables

Create `frontend/.env` locally. Do not commit this file.

```env
VITE_APP_NAME="iLab BD"
VITE_APP_ENV="development"
VITE_SITE_URL="http://localhost:5173"
VITE_API_BASE_URL="http://127.0.0.1:8000/api/v1"
VITE_STORAGE_URL="http://127.0.0.1:8000/storage"
VITE_GOOGLE_CLIENT_ID="your-google-client-id"
```

## Development

```bash
npm install
npm run dev
```

The frontend usually runs at `http://localhost:5173`.

## Production Build

```bash
npm run build
```

The output is generated in `frontend/dist`.

## Architecture

- Public pages live in `src/pages`.
- Student dashboard pages live in `src/pages/dashboard`.
- Admin panel pages live in `src/pages/admin`.
- Shared API helpers live in `src/lib/api.ts`.
- Student auth state lives in `src/lib/auth.ts`.
- Admin auth state lives in `src/lib/admin/useAdminAuth.ts`.
- API-specific service files live in `src/services`.

Authentication uses Laravel Sanctum Bearer tokens returned by the backend API.
