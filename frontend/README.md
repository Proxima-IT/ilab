# iLab BD — Frontend Web Application

A modern, high-performance web platform for **iLab BD** (Mobile Repairing Courses in Bangladesh). Built with React, Vite, Tailwind CSS v4, and integrated with Supabase for backend services.

---

## 🚀 Tech Stack

- **Frontend Core**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite v8](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (using `@tailwindcss/vite` plugin)
- **Routing**: [React Router v7](https://reactrouter.com/) (Client-Side SPA)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

---

## 📁 Project Structure

```text
├── public/                 # Static assets (favicons, logos, etc.)
├── src/
│   ├── assets/             # Images and local media assets
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Shadcn-based primitive components (buttons, inputs, etc.)
│   │   └── site/           # Website-specific components (Header, Footer, Hero, etc.)
│   ├── contexts/           # React Contexts (e.g., Language translation context)
│   ├── hooks/              # Custom React hooks (e.g., useStudentData)
│   ├── integrations/       # External integrations
│   │   └── supabase/       # Supabase client and auto-generated TypeScript types
│   ├── lib/                # Core utilities, authentication helpers, and SEO builders
│   │   ├── admin/          # Admin-specific auth and helper functions
│   │   └── auth.ts         # Student-facing authentication store (using useSyncExternalStore)
│   ├── pages/              # Page components
│   │   ├── admin/          # Admin Panel pages (Courses, Categories, Users, Blog, etc.)
│   │   ├── dashboard/      # Student Portal pages (Overview, Player, Progress, Certificates)
│   │   └── *.tsx           # Public pages (Index, Courses, Events, Blog, Login, Signup)
│   ├── services/           # API and data-fetching services
│   ├── app.tsx             # App entry, routing configuration, and route guards
│   ├── main.tsx            # React mounting and DOM entry
│   └── styles.css          # Tailwind CSS v4 main stylesheet
├── supabase/               # Local Supabase configurations and migrations
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite bundling and plugin configuration
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18 or higher) installed.

### 2. Install Dependencies
Run the following command in the root directory:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory (or update the existing one) with your Supabase credentials:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-key"
VITE_SITE_URL="http://localhost:5173"
```

### 4. Run the Development Server
```bash
npm run dev
```
The application will start, typically at `http://localhost:5173`.

### 5. Build for Production
To build the optimized production bundle:
```bash
npm run build
```
The output will be generated in the `dist/` directory.

---

## 🔑 Key Architecture & Implementation Details

### 1. Routing & Route Guards
All routes are managed in `src/app.tsx` using `react-router-dom`.
- **Public Routes**: Accessible by anyone (e.g., `/`, `/courses`, `/blog`, `/login`).
- **Protected Student Routes**: Wrapped with `<ProtectedRoute />`. Redirects unauthenticated users to `/login`.
  - Prefix: `/dashboard` (Student Portal)
- **Protected Admin Routes**: Wrapped with `<AdminRoute />`. Restricts access to users with the `super_admin` or `content_manager` role.
  - Prefix: `/admin` (Admin Panel)

### 2. Authentication
- **Student Auth**: Defined in `src/lib/auth.ts`. Uses `useSyncExternalStore` for an ultra-fast, reactive, and SSR-safe client-state store, syncing automatically with `localStorage` and Supabase.
- **Admin Auth**: Managed in `src/lib/admin/useAdminAuth.ts`. It verifies if the logged-in user possesses admin privileges by querying the `user_roles` table in Supabase.

### 3. Student Dashboard
The student portal is located at `src/pages/dashboard/` and contains:
- **Overview**: Overall progress, learning stats, and gamified level/XP progress.
- **My Courses**: List of enrolled courses.
- **Class Player**: A custom video player for lectures, sidebar playlist, and tabs for notes/resources.
- **Leaderboard**: A gamified list showing top students by XP.
- **Certificates**: Displays earned certificates.

### 4. Admin Panel
Located at `src/pages/admin/`, the admin panel allows managing:
- Courses, Categories, Batches, and Promo Codes.
- Student Enrollments.
- Blogs and Events.
- User Roles (Super Admin / Content Manager) via the **Users & Roles** page.

---

## 📝 Developer Guidelines

### Styling with Tailwind CSS v4
This project uses **Tailwind CSS v4**. Theme configurations, custom gradients, and animations are defined directly in [src/styles.css](file:///Users/tahsinslife/Downloads/iLab%20Frontend%20Mastery/src/styles.css) using `@theme` directives instead of a `tailwind.config.js` file.

Example:
```css
@theme {
  --color-primary: #f97316;
  --color-surface: #18181b;
}
```

### Database Operations
All database queries use the auto-generated Supabase client located at [src/integrations/supabase/client.ts](file:///Users/tahsinslife/Downloads/iLab%20Frontend%20Mastery/src/integrations/supabase/client.ts). Types are imported from `./types` for full TypeScript safety.
