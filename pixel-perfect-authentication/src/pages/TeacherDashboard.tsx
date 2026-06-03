import { Link } from "react-router-dom";
import {
  Plus,
  BookOpen,
  Users,
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  TrendingUp,
  Clock,
  FileCheck,
  UserCheck,
  Star,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getTeacherCourses,
  deleteCourse,
  getTeacherProfile,
  getDashboardTotalStudents,
  getDashboardPendingSubmissions,
  getDashboardPendingEnrollments,
  getDashboardMonthlyRevenue,
  getDashboardMostPopularCourse,
  CourseDto,
  getCourseDetails,
} from "@/lib/teacher-api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WithdrawalsSection from "@/components/teacher/WithdrawalsSection";
import { toast } from "sonner";
import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";

const TeacherDashboard = () => {
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<any>({
    queryKey: ["teacher-profile"],
    queryFn: getTeacherProfile,
    retry: 1,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  const {
    data,
    isLoading: loading,
    isError,
    error,
  } = useQuery({
    queryKey: ["teacher-courses"],
    queryFn: getTeacherCourses,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: totalStudents = 0 } = useQuery({
    queryKey: ["teacher-dashboard-students"],
    queryFn: getDashboardTotalStudents,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const { data: pendingSubmissions = 0 } = useQuery({
    queryKey: ["teacher-dashboard-submissions"],
    queryFn: getDashboardPendingSubmissions,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const { data: pendingEnrollments = 0 } = useQuery({
    queryKey: ["teacher-dashboard-enrollments"],
    queryFn: getDashboardPendingEnrollments,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const { data: monthlyRevenue = 0 } = useQuery({
    queryKey: ["teacher-dashboard-revenue"],
    queryFn: getDashboardMonthlyRevenue,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const { data: mostPopularCourse } = useQuery<CourseDto | null>({
    queryKey: ["teacher-dashboard-popular"],
    queryFn: getDashboardMostPopularCourse,
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const courses = Array.isArray(data) ? data : [];

  const handleDeleteCourse = async (courseId: number) => {
    if (
      !confirm(
        "Haqiqatan ham ushbu kursni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.",
      )
    )
      return;

    try {
      await deleteCourse(courseId);
      toast.success("Kurs o'chirildi");
      queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
    } catch (error) {
      toast.error("O'chirishda xatolik yuz berdi");
    }
  };

  const stats = [
    {
      title: "Jami O'quvchilar",
      value: (typeof totalStudents === "number" ? totalStudents : 0).toString(),
      icon: Users,
      color: "bg-green-500",
    },
    {
      title: "Oylik Daromad",
      value: `${(typeof monthlyRevenue === "number" ? monthlyRevenue : 0).toLocaleString()} so'm`,
      icon: DollarSign,
      color: "bg-orange-500",
    },
    {
      title: "Kutilayotgan Vazifalar",
      value: (pendingSubmissions !== undefined && pendingSubmissions !== null
        ? Array.isArray(pendingSubmissions)
          ? pendingSubmissions.length
          : typeof pendingSubmissions === "number"
            ? pendingSubmissions
            : 0
        : 0
      ).toString(),
      icon: FileCheck,
      color: "bg-blue-500",
    },
    {
      title: "Kutilayotgan A'zoliklar",
      value: (pendingEnrollments !== undefined && pendingEnrollments !== null
        ? Array.isArray(pendingEnrollments)
          ? pendingEnrollments.length
          : typeof pendingEnrollments === "number"
            ? pendingEnrollments
            : 0
        : 0
      ).toString(),
      icon: UserCheck,
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {profile
                ? `Salom, ${profile.firstName} ${profile.lastName}!`
                : "Teacher Dashboard"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Kurslaringizni boshqaring va natijalarni kuzatib boring.
            </p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link to="/teacher/courses/new" className="flex items-center gap-2">
              <Plus size={18} />
              Yangi Kurs Yaratish
            </Link>
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-gradient-to-br from-primary to-blue-600 text-white overflow-hidden group">
            <CardContent className="p-0 relative">
              <div className="p-6 relative z-10">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-300" />
                  Refleksiyalarni Baholash
                </h3>
                <p className="text-primary-foreground/80 text-sm mb-6 max-w-[280px]">
                  O'quvchilaringiz tomonidan topshirilgan yangi refleksiyalarni
                  tezda ko'rib chiqing va baholang.
                </p>
                <Button
                  asChild
                  variant="secondary"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white font-bold rounded-xl"
                >
                  <Link
                    to="/teacher/grading"
                    className="flex items-center gap-2"
                  >
                    Baholash sahifasiga o'tish
                    <ExternalLink size={14} />
                  </Link>
                </Button>
              </div>
              <Sparkles
                className="absolute -right-8 -bottom-8 h-40 w-40 text-white/10 rotate-12 group-hover:rotate-45 transition-transform duration-700"
                strokeWidth={1}
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden group">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Kutilayotgan Vazifalar
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {(Array.isArray(pendingSubmissions)
                      ? pendingSubmissions.length
                      : (pendingSubmissions as number)) > 0
                      ? `Sizda ${Array.isArray(pendingSubmissions) ? pendingSubmissions.length : pendingSubmissions} ta kutilayotgan vazifa bor.`
                      : "Hozircha kutilayotgan vazifalar yo'q."}
                  </p>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-slate-100 hover:bg-slate-50 font-bold"
                >
                  <Link
                    to="/teacher/grading"
                    className="flex items-center gap-2"
                  >
                    Hammasini ko'rish
                  </Link>
                </Button>
              </div>
              <div className="h-20 w-20 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                <FileCheck size={32} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-shadow bg-white rounded-2xl"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {stat.value}
                    </h3>
                  </div>
                  <div
                    className={`${stat.color} h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-lg group-hover:rotate-12 transition-all`}
                  >
                    <stat.icon size={20} strokeWidth={2.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Most Popular Course */}
        {mostPopularCourse && (
          <Card className="border-none shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star size={18} className="text-yellow-500" />
                Eng Ommabop Kurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden border">
                  {mostPopularCourse.thumbnailUrl ? (
                    <img
                      src={mostPopularCourse.thumbnailUrl}
                      alt={mostPopularCourse.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <BookOpen size={24} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {mostPopularCourse.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {mostPopularCourse.studentsCount || 0} o'quvchi ·{" "}
                    {mostPopularCourse.price?.toLocaleString()} so'm
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Table */}
        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mening Kurslarim</CardTitle>
              <CardDescription>
                Siz tomondan yaratilgan barcha kurslar ro'yxati.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[400px]">Kurs Nomi</TableHead>
                    <TableHead>Narxi</TableHead>
                    <TableHead>O'quvchilar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Yuklanmoqda...
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-destructive font-medium"
                      >
                        {(error as any)?.message?.includes("429")
                          ? "Serverga juda ko'p so'rov yuborildi. Iltimos, birozdan keyin qayta urinib ko'ring."
                          : "Kurslarni yuklashda xatolik yuz berdi."}
                      </TableCell>
                    </TableRow>
                  ) : courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Hali kurslar yaratilmagan.
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((course) => (
                      <TableRow
                        key={course.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden border">
                              {course.thumbnailUrl ? (
                                <img
                                  src={course.thumbnailUrl}
                                  alt={course.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <BookOpen size={20} />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {course.title}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <BookOpen size={12} />{" "}
                                {course.modulesCount ??
                                  (Array.isArray(course.modules)
                                    ? course.modules.length
                                    : 0)}{" "}
                                ta modul
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {course.price?.toLocaleString()} so'm
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users
                              size={14}
                              className="text-muted-foreground"
                            />
                            {course.studentsCount || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              course.status === "APPROVED"
                                ? "default"
                                : course.status === "PENDING"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs font-semibold px-2 py-0.5"
                            style={{
                              backgroundColor:
                                course.status === "APPROVED"
                                  ? "rgba(34, 197, 94, 0.1)"
                                  : course.status === "PENDING"
                                    ? "rgba(234, 179, 8, 0.1)"
                                    : "rgba(239, 68, 68, 0.1)",
                              color:
                                course.status === "APPROVED"
                                  ? "#16a34a"
                                  : course.status === "PENDING"
                                    ? "#ca8a04"
                                    : "#dc2626",
                              border: "none",
                            }}
                          >
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/teacher/courses/${course.id}/edit`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit size={14} /> Tahrirlash
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  to={`/course/${course.id}`}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <ExternalLink size={14} /> Ko'rish
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                                onClick={() => handleDeleteCourse(course.id!)}
                              >
                                <Trash2 size={14} /> O'chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals Section */}
        <div className="mt-8">
          <WithdrawalsSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeacherDashboard;
