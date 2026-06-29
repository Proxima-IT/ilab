import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import {
  useStudentDataValue,
  StudentDataContext,
} from "@/hooks/useStudentData";
import { useAuth } from "@/lib/auth";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Enroll from "@/pages/Enroll";
import EnrollSuccess from "@/pages/EnrollSuccess";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import Blog from "@/pages/Blog";
import BlogDetail from "@/pages/BlogDetail";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminClaim from "@/pages/admin/AdminClaim";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminInstructors from "@/pages/admin/AdminInstructors";
import AdminBatches from "@/pages/admin/AdminBatches";
import AdminPromoCodes from "@/pages/admin/AdminPromoCodes";
import AdminEnrollments from "@/pages/admin/AdminEnrollments";
import AdminBlog from "@/pages/admin/AdminBlog";
import AdminEvents from "@/pages/admin/AdminEvents";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminFaqs from "@/pages/admin/AdminFaqs";
import AdminOfferings from "@/pages/admin/AdminOfferings";
import AdminSite from "@/pages/admin/AdminSite";
import AdminUsers from "@/pages/admin/AdminUsers";

import DashboardLayout from "@/pages/dashboard/DashboardLayout";
import OverviewPage from "@/pages/dashboard/OverviewPage";
import MyCoursesPage from "@/pages/dashboard/MyCoursesPage";
import ClassPlayerPage from "@/pages/dashboard/ClassPlayerPage";
import ProgressPage from "@/pages/dashboard/ProgressPage";
import CertificatesPage from "@/pages/dashboard/CertificatesPage";
import LeaderboardPage from "@/pages/dashboard/LeaderboardPage";
import ResourcesPage from "@/pages/dashboard/ResourcesPage";
import ProfilePage from "@/pages/dashboard/ProfilePage";

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function AdminRoute() {
  const auth = useAdminAuth();

  if (auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!auth.userId || !auth.isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

function StudentPortalWrapper() {
  const studentData = useStudentDataValue();

  return (
    <StudentDataContext.Provider value={studentData}>
      <LanguageProvider>
        <DashboardLayout />
      </LanguageProvider>
    </StudentDataContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/enroll/:slug" element={<Enroll />} />
          <Route path="/enroll/success" element={<EnrollSuccess />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/claim" element={<AdminClaim />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="instructors" element={<AdminInstructors />} />
            <Route path="batches" element={<AdminBatches />} />
            <Route path="promo-codes" element={<AdminPromoCodes />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="faqs" element={<AdminFaqs />} />
            <Route path="offerings" element={<AdminOfferings />} />
            <Route path="site" element={<AdminSite />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<StudentPortalWrapper />}>
            <Route index element={<OverviewPage />} />
            <Route path="my-courses" element={<MyCoursesPage />} />
            <Route
              path="player/:courseSlug/:lectureId"
              element={<ClassPlayerPage />}
            />
            <Route path="progress" element={<ProgressPage />} />
            <Route path="certificates" element={<CertificatesPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}