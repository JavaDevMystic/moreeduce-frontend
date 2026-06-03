import React, { useRef, useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourseDetails,
  updateLessonProgress,
  completeLesson,
  restartCourseProgress,
  getLessonReflection,
  getLessonAssignment,
  LessonDto,
  ModuleDto,
  StudentReviewDto,
} from "@/lib/student-api";
import { getLessonQuiz } from "@/lib/quiz-api";
import QuizTaker from "@/components/student/QuizTaker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Lock,
  BookOpen,
  Menu,
  X,
  MessageSquare,
  Send,
  Reply,
  User as UserIcon,
  Sparkles,
  RotateCcw,
  FileText,
  GraduationCap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { getUser } from "@/lib/auth-api";
import ReflectionTaker from "@/components/student/ReflectionTaker";
import AssignmentTaker from "@/components/student/AssignmentTaker";

const LessonViewer = () => {
  const queryClient = useQueryClient();
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const cId = parseInt(courseId!);
  const lId = parseInt(lessonId || "0");

  const videoRef = useRef<HTMLVideoElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const [isVideoDone, setIsVideoDone] = useState(false);
  const [isQuizDone, setIsQuizDone] = useState(false);
  const [isReflectionDone, setIsReflectionDone] = useState(false);
  const [isAssignmentDone, setIsAssignmentDone] = useState(false);

  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    new Set(),
  );
  const [currentLesson, setCurrentLesson] = useState<LessonDto | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);
  const user = getUser();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  // Resize Sidebar Logic
  const startResizing = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 200 && newWidth < 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["student-course-details", cId],
    queryFn: () => getCourseDetails(cId),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Flatten all lessons in order
  const allLessons: LessonDto[] = (course?.modules ?? []).flatMap(
    (m) => m.lessons || [],
  );

  const completedLessonsCount = allLessons.filter(
    (l) => l.completed || completedLessons.has(l.id || 0),
  ).length;

  const isCourseFinished =
    allLessons.length > 0 && completedLessonsCount === allLessons.length;

  useEffect(() => {
    if (isCourseFinished && !hasShownCelebration) {
      setShowCelebration(true);
      setHasShownCelebration(true);
    }
  }, [isCourseFinished, hasShownCelebration]);

  // Set initial lesson and reset progress states
  useEffect(() => {
    if (allLessons.length > 0) {
      const lesson = lId ? allLessons.find((l) => l.id === lId) : allLessons[0];
      setCurrentLesson(lesson || allLessons[0]);

      const isDone = lesson?.completed || completedLessons.has(lesson?.id || 0);

      // Reset progress states for new lesson
      setIsVideoDone(!lesson?.videoUrl || isDone);
      setIsQuizDone(isDone);
      setIsReflectionDone(isDone);
      setIsAssignmentDone(isDone);
    }
  }, [course, lId, completedLessons]);

  const progressMutation = useMutation({
    mutationFn: ({
      lessonId,
      position,
    }: {
      lessonId: number;
      position: number;
    }) => updateLessonProgress(lessonId, position),
  });

  const completeMutation = useMutation({
    mutationFn: (lessonId: number) => completeLesson(lessonId),
    onSuccess: (_, lessonId) => {
      setCompletedLessons((prev) => new Set([...prev, lessonId]));
      // Invalidate all related progress queries
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
      queryClient.invalidateQueries({
        queryKey: ["course-lessons"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["student-course-details"],
        exact: false,
      });
      toast.success("Dars tugallandi! ✓");
    },
  });

  const restartMutation = useMutation({
    mutationFn: () => restartCourseProgress(cId),
    onSuccess: () => {
      toast.success("Kurs muvaffaqiyatli qayta boshlandi");
      window.location.reload(); // Simplest way to reset all states and progress
    },
    onError: (err: any) => {
      toast.error(err.message || "Kursni qayta boshlashda xatolik yuz berdi");
    },
  });

  // Auto-track progress every 10 seconds
  useEffect(() => {
    if (!currentLesson?.id || !videoRef.current) return;

    progressIntervalRef.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        progressMutation.mutate({
          lessonId: currentLesson.id!,
          position: Math.floor(videoRef.current.currentTime),
        });
      }
    }, 10000);

    return () => {
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    };
  }, [currentLesson]);

  // Task existence check
  const { data: lessonQuiz } = useQuery({
    queryKey: ["lesson-quiz-check", currentLesson?.id],
    queryFn: () =>
      currentLesson?.id
        ? getLessonQuiz(currentLesson.id).catch(() => null)
        : null,
    enabled: !!currentLesson?.id,
  });

  const { data: lessonReflection } = useQuery({
    queryKey: ["lesson-reflection-check", currentLesson?.id],
    queryFn: () =>
      currentLesson?.id
        ? getLessonReflection(currentLesson.id).catch(() => null)
        : null,
    enabled: !!currentLesson?.id,
  });

  const { data: lessonAssignment } = useQuery({
    queryKey: ["lesson-assignment-check", currentLesson?.id],
    queryFn: () =>
      currentLesson?.id
        ? getLessonAssignment(currentLesson.id).catch(() => null)
        : null,
    enabled: !!currentLesson?.id,
  });

  const hasQuiz = !!(lessonQuiz && lessonQuiz.questions?.length);
  const hasReflection = !!lessonReflection;
  const hasAssignment = !!lessonAssignment;

  const handleVideoEnd = () => {
    setIsVideoDone(true);
    if (currentLesson?.id && !completedLessons.has(currentLesson.id)) {
      // If there are no other tasks, mark the lesson as complete immediately when the video ends
      if (!hasQuiz && !hasReflection && !hasAssignment) {
        completeMutation.mutate(currentLesson.id);
      }
    }
  };

  const handleLessonSelect = (lesson: LessonDto) => {
    setCurrentLesson(lesson);
    // Reset video
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Mark lesson as complete if everything is done
  useEffect(() => {
    if (currentLesson?.id && !completedLessons.has(currentLesson.id)) {
      const videoRequirementMet = !currentLesson.videoUrl || isVideoDone;
      const quizRequirementMet = !hasQuiz || isQuizDone;
      const reflectionRequirementMet = !hasReflection || isReflectionDone;
      const assignmentRequirementMet = !hasAssignment || isAssignmentDone;

      if (
        videoRequirementMet &&
        quizRequirementMet &&
        reflectionRequirementMet &&
        assignmentRequirementMet
      ) {
        completeMutation.mutate(currentLesson.id);
      }
    }
  }, [
    isVideoDone,
    isQuizDone,
    isReflectionDone,
    isAssignmentDone,
    currentLesson,
    completedLessons,
    hasQuiz,
    hasReflection,
    hasAssignment,
  ]);

  // Auto-scroll to next section
  const quizRef = useRef<HTMLDivElement>(null);
  const reflectionRef = useRef<HTMLDivElement>(null);
  const assignmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVideoDone && quizRef.current)
      quizRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [isVideoDone]);

  useEffect(() => {
    if (isQuizDone && reflectionRef.current)
      reflectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [isQuizDone]);

  useEffect(() => {
    if (isReflectionDone && assignmentRef.current)
      assignmentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }, [isReflectionDone]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-white text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl max-w-md text-center">
          <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            Ma'lumotlarni yuklashda xatolik
          </h2>
          <p className="text-slate-400 mb-6">
            {(error as any)?.message?.includes("429")
              ? "Serverga juda ko'p so'rov yuborildi. Iltimos, birozdan keyin qayta urinib ko'ring."
              : "Kurs ma'lumotlarini yuklashda texnik xatolik yuz berdi."}
          </p>
          <Button onClick={() => window.location.reload()} className="w-full">
            Qayta urinish
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-slate-800 mx-auto mb-4" />
          <p className="text-slate-500">Kurs topilmadi.</p>
          <Button asChild variant="link" className="mt-4">
            <Link to="/student/dashboard">Dashboardga qaytish</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-4 px-4 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
        <Link
          to="/student/dashboard"
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 truncate">{course.title}</p>
          <p className="font-semibold text-sm truncate">
            {currentLesson?.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {completedLessonsCount}/{allLessons.length} dars
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white h-8 gap-1.5"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            Darslar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div
          className={cn(
            "flex flex-col flex-1 overflow-y-auto relative custom-scrollbar transition-all duration-300",
          )}
          style={{ marginRight: sidebarOpen ? `${sidebarWidth}px` : "0" }}
        >
          {currentLesson?.videoUrl ? (
            <>
              {/* Subtle background glow */}
              <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
              <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
              {/* Video Player Section */}
              <div className="bg-black/40 backdrop-blur-md flex items-center justify-center relative shrink-0 overflow-hidden border-b border-white/5 shadow-2xl">
                <div className="w-full max-w-[1200px] mx-auto relative group p-2 sm:p-4">
                  <div className="relative aspect-video max-h-[55vh] w-full bg-slate-950 flex items-center justify-center rounded-[24px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5">
                    <video
                      ref={videoRef}
                      key={currentLesson.id}
                      controls
                      className="h-full w-full object-contain"
                      onEnded={handleVideoEnd}
                      autoPlay
                    >
                      <source src={currentLesson.videoUrl} />
                      Brauzeringiz video formatini qo'llab-quvvatlamaydi.
                    </video>

                    {/* Subtle vignette for focus */}
                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]"></div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 flex flex-col items-center justify-center py-20 px-6 border-b border-white/5 relative overflow-hidden">
              <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="relative z-10 text-center space-y-4 max-w-md">
                <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black text-white">Nazariy dars</h3>
                <p className="text-slate-400">
                  Ushbu darsda video mavjud emas. Pastdagi topshiriqlarni
                  bajaring va dars bo'yicha o'z fikringizni bildiring.
                </p>
              </div>
            </div>
          )}
          {/* Content (Controls & Comments) */}
          <div className="min-h-full">
            <div className="max-w-4xl mx-auto px-6 py-6" id="lesson-content">
              {/* Lesson Info & Controls */}
              <div className="mb-8">
                <h2 className="font-bold text-xl mb-2">
                  {currentLesson?.title}
                </h2>
                {currentLesson?.transcription && (
                  <p className="text-slate-400 text-base leading-relaxed mb-6">
                    {currentLesson.transcription}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-800/20 backdrop-blur-xl rounded-[32px] border border-white/10 shadow-xl">
                  <Button
                    variant="ghost"
                    size="lg"
                    className="hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-2xl h-14 px-8 border border-transparent hover:border-white/5"
                    onClick={() => prevLesson && handleLessonSelect(prevLesson)}
                    disabled={!prevLesson}
                  >
                    <ChevronLeft className="mr-3 h-5 w-5" /> Oldingi dars
                  </Button>

                  <div className="flex items-center gap-3">
                    {(currentLesson?.completed ||
                      (isVideoDone &&
                        isQuizDone &&
                        isReflectionDone &&
                        isAssignmentDone)) && (
                      <div className="hidden md:flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20 animate-in fade-in zoom-in duration-500">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-black uppercase tracking-widest">
                          Tugallandi
                        </span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="default"
                    size="lg"
                    className={cn(
                      "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-black h-14 px-10 rounded-2xl transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]",
                      nextLesson &&
                        (!isVideoDone ||
                          !isQuizDone ||
                          !isReflectionDone ||
                          !isAssignmentDone) &&
                        "opacity-50 grayscale cursor-not-allowed",
                    )}
                    onClick={() => {
                      if (nextLesson) {
                        handleLessonSelect(nextLesson);
                        // Scroll top
                        document
                          .getElementById("lesson-content")
                          ?.scrollIntoView();
                      } else if (isCourseFinished) {
                        navigate("/student/dashboard");
                      }
                    }}
                    disabled={
                      nextLesson &&
                      (!isVideoDone ||
                        !isQuizDone ||
                        !isReflectionDone ||
                        !isAssignmentDone)
                    }
                  >
                    {!nextLesson && isCourseFinished ? (
                      <>
                        Dashboardga qaytish{" "}
                        <ChevronRight className="ml-3 h-5 w-5" />
                      </>
                    ) : (
                      <>
                        Keyingi dars <ChevronRight className="ml-3 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>

                {isCourseFinished && !nextLesson && (
                  <div className="mt-8 p-8 md:p-10 rounded-[32px] bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-6">
                      <GraduationCap className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-black mb-4">
                      Tabriklaymiz! Kursni tugatdingiz. 🎉
                    </h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                      Barcha darslar muvaffaqiyatli yakunlandi. Endi yangi
                      marralarni zabt etish vaqti keldi!
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <Button
                        asChild
                        size="lg"
                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-black px-10 h-14 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
                      >
                        <Link to="/student/dashboard">Dashboardga qaytish</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quiz Section */}
              {currentLesson?.id && (
                <QuizTaker
                  lessonId={currentLesson.id}
                  onComplete={() => setIsQuizDone(true)}
                />
              )}

              {/* Reflection Section */}
              {currentLesson?.id && (
                <ReflectionTaker
                  lessonId={currentLesson.id}
                  onComplete={() => setIsReflectionDone(true)}
                />
              )}

              {/* Assignment Section */}
              {currentLesson?.id && (
                <AssignmentTaker
                  lessonId={currentLesson.id}
                  onComplete={() => setIsAssignmentDone(true)}
                />
              )}

              <div className="h-8" />
            </div>
          </div>
        </div>

        {/* Resizer Handle */}
        {sidebarOpen && (
          <div
            onMouseDown={startResizing}
            className={cn(
              "hidden md:block fixed right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-[60] transition-colors",
              isResizing ? "bg-primary" : "bg-white/5 hover:bg-primary/50",
            )}
            style={{ right: `${sidebarWidth}px` }}
          />
        )}

        {/* Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed right-0 top-0 bottom-0 bg-slate-900 border-l border-slate-800 flex flex-col z-50 overflow-y-auto mt-[57px] md:mt-0 transition-all duration-300"
            style={{ width: `${sidebarWidth}px` }}
          >
            <div className="px-4 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">O'quv Rejasi</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {completedLessonsCount}/{allLessons.length} tugallandi
              </p>
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${allLessons.length > 0 ? (completedLessonsCount / allLessons.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(course.modules || []).map((module: ModuleDto, mIdx: number) => (
                <div key={module.id}>
                  <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 sticky top-0">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {mIdx + 1}. {module.title}
                    </p>
                  </div>
                  {(module.lessons || []).map(
                    (lesson: LessonDto, lIdx: number) => {
                      const isActive = currentLesson?.id === lesson.id;
                      const isDone =
                        completedLessons.has(lesson.id) || lesson.completed;
                      const isLocked =
                        !isDone &&
                        !isActive &&
                        currentIndex !== -1 &&
                        lIdx > currentIndex &&
                        !completedLessons.has(currentLesson?.id || 0);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() =>
                            !isLocked && handleLessonSelect(lesson)
                          }
                          className={cn(
                            "w-full text-left px-4 py-3 flex items-start gap-3 transition-all border-b border-slate-800/50",
                            isActive
                              ? "bg-primary/20 border-l-2 border-l-primary"
                              : "hover:bg-slate-800/50",
                            isLocked &&
                              "opacity-40 cursor-not-allowed grayscale",
                          )}
                        >
                          <div className="shrink-0 mt-0.5">
                            {isDone ? (
                              <CheckCircle2 className="h-5 w-5 text-green-400" />
                            ) : isLocked ? (
                              <Lock className="h-4 w-4 text-slate-500" />
                            ) : isActive ? (
                              <PlayCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-slate-600 flex items-center justify-center">
                                <span className="text-[9px] text-slate-500 font-mono">
                                  {lIdx + 1}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isActive ? "text-white" : "text-slate-300",
                              )}
                            >
                              {lesson.title}
                            </p>
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Course Completion Modal */}
      {showCelebration && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setShowCelebration(false)}
        >
          <div
            className="relative overflow-hidden rounded-[40px] p-8 md:p-12 text-center border border-emerald-500/30 bg-gradient-to-br from-emerald-600/20 via-slate-900 to-blue-600/20 shadow-2xl max-w-2xl w-full animate-in zoom-in slide-in-from-bottom-8 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all z-20"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 animate-pulse"></div>
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-emerald-500/20 border border-emerald-500/50 mb-4 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <Sparkles className="h-12 w-12 text-emerald-400 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  TABRIKLAYMIZ! 🎉
                </h1>
                <p className="text-emerald-400/80 font-bold uppercase tracking-[0.2em] text-sm">
                  Kurs muvaffaqiyatli yakunlandi
                </p>
              </div>
              <p className="text-slate-400 max-w-lg mx-auto leading-relaxed">
                Siz "{course?.title}" kursining barcha dars va topshiriqlarini
                muvaffaqiyatli tamomladingiz. Bilimlaringizni amalda qo'llashda
                ulkan muvaffaqiyatlar tilaymiz!
              </p>
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-black px-10 h-14 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                >
                  <Link to="/student/dashboard">Dashboardga qaytish</Link>
                </Button>
              </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonViewer;
