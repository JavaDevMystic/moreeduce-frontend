import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Courses from "@/pages/Courses";
import NotFound from "@/pages/NotFound";
import TeacherDashboard from "@/pages/TeacherDashboard";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminCourses from "@/pages/AdminCourses";
import AdminWithdrawals from "@/pages/AdminWithdrawals";
import AdminPayments from "@/pages/AdminPayments";
import AdminComments from "@/pages/AdminComments";
import AdminAuditLogs from "@/pages/AdminAuditLogs";
import AdminSettings from "@/pages/AdminSettings";
import AdminStatistics from "@/pages/AdminStatistics";
import AdminEnrollments from "@/pages/AdminEnrollments";
import CourseDetails from "@/pages/CourseDetails";
import SuperAdminAdmins from "@/pages/SuperAdminAdmins";
import StudentDashboard from "@/pages/StudentDashboard";
import LessonViewer from "@/pages/LessonViewer";
import CourseEditor from "@/pages/CourseEditor";
import TeacherGrading from "@/pages/TeacherGrading";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/grading" element={<TeacherGrading />} />
          <Route path="/teacher/courses/new" element={<CourseEditor />} />
          <Route path="/teacher/courses/:id/edit" element={<CourseEditor />} />
          <Route path="/course/:id" element={<CourseDetails />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/learn/:courseId" element={<LessonViewer />} />
          <Route path="/learn/:courseId/:lessonId" element={<LessonViewer />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="withdrawals" element={<AdminWithdrawals />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="comments" element={<AdminComments />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="statistics" element={<AdminStatistics />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
            <Route path="admins" element={<SuperAdminAdmins />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
