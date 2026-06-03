import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getEnrolledCourses,
  getCourseLessons,
  getCourseDetails,
  restartCourseProgress,
  LessonDto,
} from "@/lib/student-api";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, Play, GraduationCap, Clock, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const StudentDashboard = () => {
  const queryClient = useQueryClient();

  const {
    data: courses,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["enrolled-courses"],
    queryFn: getEnrolledCourses,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const restartMutation = useMutation({
    mutationFn: (courseId: number) => restartCourseProgress(courseId),
    onSuccess: (_, courseId) => {
      toast.success("Kurs muvaffaqiyatli qayta boshlandi");
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
      queryClient.invalidateQueries({ queryKey: ["course-lessons", courseId] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Kursni qayta boshlashda xatolik yuz berdi");
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 space-y-10">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2">
              Mening ta'limim
            </p>
            <h1 className="text-4xl font-extrabold text-slate-900">
              Mening kurslarim
            </h1>
          </div>
          <Link to="/">
            <Button variant="outline" className="rounded-full font-bold">
              Kurslarni ko'rish
            </Button>
          </Link>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-6">
          {(() => {
            const finishedCoursesCount = (courses || []).filter((course) => {
              const lessons = (course.modules || []).flatMap(
                (m) => m.lessons || [],
              );

              if (!lessons || lessons.length === 0) return false;
              return lessons.every((l) => l.completed);
            }).length;

            return [
              {
                label: "Jami kurslar",
                value: courses?.length ?? 0,
                icon: BookOpen,
              },
              {
                label: "Tugallangan",
                value: finishedCoursesCount,
                icon: GraduationCap,
              },
              { label: "O'rganilgan soat", value: "~", icon: Clock },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-white border border-slate-100 rounded-2xl p-6 text-center shadow-sm"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-3xl font-extrabold text-slate-900">
                  {s.value}
                </p>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {s.label}
                </p>
              </div>
            ));
          })()}
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-red-100 bg-red-50/30">
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              Yuklashda xatolik yuz berdi
            </h2>
            <p className="text-slate-500 mb-8 font-medium">
              {(error as any)?.message?.includes("429")
                ? "Serverga juda ko'p so'rov yuborildi. Iltimos, birozdan keyin qayta urinib ko'ring."
                : "Kurslarni yuklashda texnik xatolik yuz berdi."}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="rounded-full px-8 font-bold"
            >
              Qayta urinish
            </Button>
          </div>
        ) : courses?.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
            <GraduationCap className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">
              Hali hech qanday kursga a'zo emassiz
            </h2>
            <p className="text-slate-400 mb-8">
              Qiziqarli kurslar topib, o'rganishni boshlang!
            </p>
            <Link to="/">
              <Button className="rounded-full px-8 font-bold">
                Kurslarni ko'rish
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses?.map((course) => {
              const lessons = (course.modules || []).flatMap(
                (m) => m.lessons || [],
              );

              const totalLessons = lessons.length;
              const completedLessonsCount = lessons.filter(
                (l) => l.completed,
              ).length;
              const progressPercentage =
                totalLessons > 0
                  ? (completedLessonsCount / totalLessons) * 100
                  : 0;

              return (
                <Link
                  key={course.id}
                  to={`/learn/${course.id}`}
                  className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-44 overflow-hidden bg-slate-100 shrink-0">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white">
                        <Play className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
                      {course.category}
                    </p>
                    <h3 className="font-bold text-slate-800 text-base line-clamp-2 mb-2 flex-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">
                      by {course.teacherName} •{" "}
                      {course.modules?.length || course.modulesCount || 0} modul
                    </p>

                    <div className="space-y-2 mb-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Progress</span>
                        <span
                          className={cn(
                            progressPercentage === 100
                              ? "text-emerald-500"
                              : "text-primary",
                          )}
                        >
                          {`${progressPercentage.toFixed(0)}%`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-1000",
                            progressPercentage === 100
                              ? "bg-emerald-500"
                              : "bg-primary",
                          )}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between mt-auto">
                      <span className="text-xs font-bold text-slate-600">
                        {completedLessonsCount}/{totalLessons} dars tugallandi
                      </span>
                      {progressPercentage === 100 ? (
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tighter text-emerald-500">
                          Kurs tugatildi ✓
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-primary">
                          Davom etish →
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
