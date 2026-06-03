import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getTeacherCourses,
  CourseDto,
  getCourseDetails,
  getLessonReflection,
  getLessonAssignment,
  LessonDto,
} from "@/lib/teacher-api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  ChevronRight,
  Sparkles,
  FileText,
  CheckCircle2,
  GraduationCap,
  Search,
  BookMarked,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReflectionGrader from "@/components/teacher/ReflectionGrader";
import AssignmentGrader from "@/components/teacher/AssignmentGrader";
import { Input } from "@/components/ui/input";
import GradingNotifications from "@/components/teacher/GradingNotifications";

const LessonActionButtons = ({
  lesson,
  onSelectLesson,
}: {
  lesson: LessonDto;
  onSelectLesson: (lesson: {
    id: number;
    title: string;
    type: "reflection" | "assignment";
  }) => void;
}) => {
  const { data: reflection, isLoading: isRefLoading } = useQuery({
    queryKey: ["lesson-reflection-check", lesson.id],
    queryFn: () => getLessonReflection(lesson.id!).catch(() => null),
    enabled: !!lesson.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: assignment, isLoading: isAssLoading } = useQuery({
    queryKey: ["lesson-assignment-check", lesson.id],
    queryFn: () => getLessonAssignment(lesson.id!).catch(() => null),
    enabled: !!lesson.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isLoading = isRefLoading || isAssLoading;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <div className="h-10 w-10 rounded-2xl bg-slate-50 animate-pulse" />
        <div className="h-10 w-10 rounded-2xl bg-slate-50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0 ml-4">
      {reflection && (
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-2xl hover:bg-primary/10 hover:text-primary transition-all group/btn"
          title="Refleksiya"
          onClick={() =>
            onSelectLesson({
              id: lesson.id!,
              title: lesson.title,
              type: "reflection",
            })
          }
        >
          <Sparkles className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
        </Button>
      )}
      {assignment && (
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 rounded-2xl hover:bg-orange-500/10 hover:text-orange-600 transition-all group/btn"
          title="Topshiriq"
          onClick={() =>
            onSelectLesson({
              id: lesson.id!,
              title: lesson.title,
              type: "assignment",
            })
          }
        >
          <FileText className="h-5 w-5 transition-transform group-hover/btn:scale-110" />
        </Button>
      )}
      {!reflection && !assignment && (
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">
          Vazifa yo'q
        </span>
      )}
    </div>
  );
};

const CourseGradingCard = ({
  course,
  onSelectLesson,
}: {
  course: CourseDto;
  onSelectLesson: (lesson: {
    id: number;
    title: string;
    type: "reflection" | "assignment";
  }) => void;
}) => {
  const { data: fullCourse, isLoading } = useQuery({
    queryKey: ["course-details", course.id],
    queryFn: () => getCourseDetails(course.id!),
    enabled: !!course.id,
  });

  const displayCourse = fullCourse || course;

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-primary/20">
            {course.title.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {course.title}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className="bg-primary/5 text-primary border-none font-bold text-[10px] uppercase"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  `${displayCourse.modules?.length || 0} ta Modul`
                )}
              </Badge>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                ID: #{course.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 bg-white/50 rounded-[32px] border border-dashed border-slate-200 flex items-center justify-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin mr-3" />
          <span className="text-sm font-bold text-slate-400">
            Darslar yuklanmoqda...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {displayCourse.modules?.map((module, mIdx) => (
            <Card
              key={module.id || mIdx}
              className="border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden bg-white rounded-[24px]"
            >
              <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                    Modul {mIdx + 1}
                  </span>
                  <CardTitle className="text-base font-black text-slate-800">
                    {module.title}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="font-bold text-[10px]">
                  {module.lessons?.length || 0} dars
                </Badge>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {module.lessons?.map((lesson, lIdx) => (
                    <div
                      key={lesson.id || lIdx}
                      className="group p-4 px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="h-9 w-9 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-hover:border-primary/20 group-hover:text-primary transition-colors">
                          {lIdx + 1}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors">
                            {lesson.title}
                          </p>
                        </div>
                      </div>

                      <LessonActionButtons
                        lesson={lesson}
                        onSelectLesson={onSelectLesson}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

const TeacherGrading = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLesson, setSelectedLesson] = useState<{
    id: number;
    title: string;
    type: "reflection" | "assignment";
  } | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["teacher-courses-grading"],
    queryFn: getTeacherCourses,
  });

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Baholash Markazi
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">
              Barcha o'quvchilaringizning topshiriqlarini shu yerdan tekshiring.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kursni qidirish..."
              className="pl-10 h-11 rounded-xl bg-white border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-12">
            {isLoading ? (
              <div className="py-20 text-center">
                <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground font-semibold animate-pulse">
                  Ma'lumotlar yuklanmoqda...
                </p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
                  <BookMarked className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  Kurslar topilmadi
                </h3>
                <p className="text-muted-foreground text-center max-w-sm px-6">
                  Sizda hali kurslar mavjud emas yoki qidiruv natijasida hech
                  narsa topilmadi.
                </p>
              </div>
            ) : (
              filteredCourses.map((course) => (
                <CourseGradingCard
                  key={course.id}
                  course={course}
                  onSelectLesson={setSelectedLesson}
                />
              ))
            )}
          </div>

          {/* Notifications Sidebar */}
          <div className="lg:col-span-4">
            <GradingNotifications onSelectLesson={setSelectedLesson} />
          </div>
        </div>
      </main>

      <Dialog
        open={!!selectedLesson}
        onOpenChange={(open) => !open && setSelectedLesson(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] p-0 border-none">
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md p-6 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-black">
                {selectedLesson?.type === "reflection" ? (
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">
                    {selectedLesson?.type === "reflection"
                      ? "Dars Refleksiyasi"
                      : "Dars Topshirig'i"}
                  </p>
                  {selectedLesson?.title}
                </div>
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6">
            {selectedLesson?.type === "reflection" ? (
              <ReflectionGrader lessonId={selectedLesson.id} />
            ) : (
              selectedLesson && (
                <AssignmentGrader lessonId={selectedLesson.id} />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default TeacherGrading;
