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
import { Toaster } from "@/components/ui/sonner";

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
import AdminProfile from "@/pages/admin/AdminProfile";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminCertificates from "@/pages/admin/AdminCertificates";
import AdminStudentProgress from "@/pages/admin/AdminStudentProgress";
import AdminPermissionsMatrix from "@/pages/admin/AdminPermissionsMatrix";
import AdminQna from "@/pages/admin/AdminQna";
import AdminActivity from "@/pages/admin/AdminActivity";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminNewsletter from "@/pages/admin/AdminNewsletter";
import AdminSystemSettings from "@/pages/admin/AdminSystemSettings";

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

function isAdminHost(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname.toLowerCase();

  return hostname === "admin.ilabbd.com" || hostname.startsWith("admin.");
}

function HomeRoute() {
  return isAdminHost() ? <Navigate to="/admin" replace /> : <Index />;
}

function LoginRoute() {
  return isAdminHost() ? <Navigate to="/admin/login" replace /> : <Login />;
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
        <Route path="/" element={<HomeRoute />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/enroll/:slug" element={<Enroll />} />
          <Route path="/enroll/success" element={<EnrollSuccess />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/claim" element={<Navigate to="/admin/login" replace />} />

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
            <Route path="profile" element={<AdminProfile />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="student-progress" element={<AdminStudentProgress />} />
            <Route path="permissions" element={<AdminPermissionsMatrix />} />
            <Route path="qna" element={<AdminQna />} />
            <Route path="activity" element={<AdminActivity />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="newsletter" element={<AdminNewsletter />} />
            <Route path="system-settings" element={<AdminSystemSettings />} />
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
          <Route path="/profile" element={<StudentPortalWrapper />}>
            <Route index element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" closeButton />
    </BrowserRouter>
  );
}
