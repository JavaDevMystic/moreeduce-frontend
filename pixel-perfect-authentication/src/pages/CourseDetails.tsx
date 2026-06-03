import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCourseDetails,
  enrollInCourse,
  getEnrolledCourses,
} from "@/lib/student-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  PlayCircle,
  Lock,
  CheckCircle2,
  Award,
  BookOpen,
  Users,
  Upload,
  MessageSquare,
  Star,
  Info,
  User,
  Clock,
  FileCheck,
  Gift,
  CreditCard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { getUser } from "@/lib/auth-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const courseId = parseInt(id!);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const user = getUser();

  const {
    data: course,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["student-course-details", courseId],
    queryFn: () => getCourseDetails(courseId),
    retry: false, // 500 xatosida qayta urinmaslik
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const { data: myCourses } = useQuery({
    queryKey: ["enrolled-courses"],
    queryFn: getEnrolledCourses,
    enabled: !!user,
  });

  // Check if fully enrolled (ACTIVE — admin approved)
  const isEnrolled = myCourses?.some((c) => c.id === courseId);

  const isFree = (course?.price ?? 1) === 0;

  const enrollMutation = useMutation({
    mutationFn: (file?: File) => enrollInCourse(courseId, file),
    onSuccess: (_data, file) => {
      queryClient.invalidateQueries({ queryKey: ["enrolled-courses"] });
      if (!file) {
        // Free course: immediately active
        toast.success("Kursga muvaffaqiyatli ro'yxatdan o'tdingiz! 🎉");
      } else {
        // Paid: waiting for admin
        toast.success("To'lov cheki yuborildi. Admin tasdiqlashini kuting.", {
          duration: 6000,
        });
      }
      setReceipt(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "A'zo bo'lishda xatolik yuz berdi.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setReceipt(e.target.files[0]);
    }
  };

  // FREE: just enroll directly
  const handleFreeEnroll = () => {
    if (!user) {
      toast.error("Kursga a'zo bo'lish uchun tizimga kiring.");
      navigate("/login");
      return;
    }
    enrollMutation.mutate(undefined);
  };

  // PAID: require receipt
  const handlePaidEnroll = () => {
    if (!user) {
      toast.error("Kursga a'zo bo'lish uchun tizimga kiring.");
      navigate("/login");
      return;
    }
    if (!receipt) {
      toast.error("Iltimos, to'lov chekini yuklang.");
      fileInputRef.current?.click();
      return;
    }
    enrollMutation.mutate(receipt);
  };

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );

  if (isError)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 p-8 rounded-3xl border-2 border-red-100 flex flex-col items-center max-w-md text-center">
          <Info className="h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Kurs yuklanmadi
          </h2>
          <p className="text-slate-500 mb-2 font-medium">
            {(error as any)?.message?.includes("500")
              ? "Server ichki xatolik qaytardi (500). Bu backend muammosi — biroz kutib qayta urinib ko'ring."
              : (error as any)?.message?.includes("429")
                ? "Juda ko'p so'rov yuborildi. Biroz kuting va qayta urining."
                : (error as any)?.message ||
                  "Kurs ma'lumotlarini yuklashda xatolik yuz berdi."}
          </p>
          <p className="text-xs text-slate-400 mb-6">Kurs ID: {courseId}</p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/")}>
              Bosh sahifa
            </Button>
            <Button
              onClick={() =>
                queryClient.invalidateQueries({
                  queryKey: ["student-course-details", courseId],
                })
              }
            >
              Qayta urinish
            </Button>
          </div>
        </div>
      </div>
    );

  if (!course && !isLoading)
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <BookOpen className="h-20 w-20 text-slate-200 mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Kurs topilmadi
        </h2>
        <p className="text-slate-500 mb-6 text-center max-w-md">
          Kechirasiz, siz qidirayotgan kurs mavjud emas yoki o'chirilgan
          bo'lishi mumkin.
        </p>
        <Button onClick={() => navigate("/")}>Bosh sahifaga qaytish</Button>
      </div>
    );

  const totalLessons = (course!.modules || []).reduce(
    (acc, m) => acc + (m.lessons?.length || 0),
    0,
  );

  // Determine enrollment state
  const isPendingApproval = !isEnrolled && enrollMutation.isSuccess && !isFree;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-[#0f172a] text-white pt-12 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/10 blur-[120px] rounded-full translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 relative z-10">
          <div className="lg:col-span-8 flex flex-col justify-center space-y-6">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-primary hover:bg-primary/90 text-white border-none py-1 px-3">
                {course!.category}
              </Badge>
              <Badge
                variant="outline"
                className="text-blue-400 border-blue-400/30 bg-blue-400/5 py-1 px-3"
              >
                {course!.language}
              </Badge>
              {isFree && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30 py-1 px-3">
                  <Gift className="h-3 w-3 mr-1" />
                  Bepul
                </Badge>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
              {course!.title}
            </h1>

            <p className="text-slate-400 text-lg md:text-xl max-w-3xl leading-relaxed">
              {course!.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm font-medium">
              <div className="flex items-center gap-2 group">
                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span>{course!.teacherName} tomonidan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </div>
                <span>
                  {course!.rating || 0} ({course!.reviews?.length || 0} sharh)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <span>{course!.studentsCount ?? 0} o'quvchi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl mb-8 overflow-hidden">
              <Tabs defaultValue="curriculum" className="w-full">
                <div className="px-6 pt-6 border-b">
                  <TabsList className="bg-transparent gap-8 h-14 p-0">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 h-full font-bold text-base transition-none"
                    >
                      Umumiy ma'lumot
                    </TabsTrigger>
                    <TabsTrigger
                      value="curriculum"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 h-full font-bold text-base transition-none"
                    >
                      O'quv rejasi
                    </TabsTrigger>
                    <TabsTrigger
                      value="instructor"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 h-full font-bold text-base transition-none"
                    >
                      O'qituvchi
                    </TabsTrigger>
                    <TabsTrigger
                      value="reviews"
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-0 h-full font-bold text-base transition-none"
                    >
                      Sharhlar
                    </TabsTrigger>
                  </TabsList>
                </div>

                <CardContent className="p-8">
                  <TabsContent
                    value="overview"
                    className="mt-0 space-y-6 animate-in fade-in duration-500"
                  >
                    <div className="prose prose-slate max-w-none">
                      <h3 className="text-xl font-bold text-slate-900 mb-4">
                        Ushbu kurs haqida
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-lg">
                        {course!.description}
                      </p>

                      <div className="grid sm:grid-cols-2 gap-4 mt-8">
                        {[
                          "Kasbiy ko'nikmalar hosil qilasiz",
                          "Amaliy tajriba orttirasiz",
                          "Sertifikat olasiz",
                          "Umrbod kirish huquqi",
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl"
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                            <span className="text-slate-700 font-medium">
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="curriculum"
                    className="mt-0 space-y-4 animate-in fade-in duration-500"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-slate-900">
                        O'quv dasturi
                      </h3>
                      <span className="text-sm text-slate-500 font-medium">
                        {course!.modules.length} modul • {totalLessons} dars
                      </span>
                    </div>

                    <Accordion
                      type="single"
                      collapsible
                      className="w-full space-y-4"
                    >
                      {(course!.modules || []).map((module, idx) => (
                        <AccordionItem
                          key={module.id}
                          value={`module-${module.id}`}
                          className="border rounded-2xl overflow-hidden px-0 bg-white"
                        >
                          <AccordionTrigger className="hover:no-underline px-6 py-5 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col items-start gap-1 text-left">
                              <span className="text-xs font-bold text-primary uppercase tracking-widest">
                                {idx + 1}-Modul
                              </span>
                              <span className="text-base font-bold text-slate-900">
                                {module.title}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-0 border-t">
                            <div className="divide-y">
                              {module.lessons?.map((lesson, lIdx) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-5 hover:bg-slate-50/50 group px-8"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                      {isEnrolled ? (
                                        <PlayCircle className="h-4 w-4 text-blue-600" />
                                      ) : (
                                        <Lock className="h-4 w-4 text-slate-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-700 text-sm">
                                        {lIdx + 1}. {lesson.title}
                                      </p>
                                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
                                        Video dars
                                      </p>
                                    </div>
                                  </div>
                                  {isEnrolled ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-xs font-bold text-primary rounded-lg hover:bg-primary/10"
                                      onClick={() =>
                                        navigate(
                                          `/learn/${courseId}/${lesson.id}`,
                                        )
                                      }
                                    >
                                      Ko'rish
                                    </Button>
                                  ) : (
                                    <Lock className="h-4 w-4 text-slate-300" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>

                  <TabsContent
                    value="instructor"
                    className="mt-0 animate-in fade-in duration-500"
                  >
                    <div className="flex flex-col items-start gap-8 p-4">
                      <div className="flex items-center gap-6">
                        <div className="h-28 w-28 rounded-3xl bg-primary/10 flex items-center justify-center ring-4 ring-white shadow-xl overflow-hidden shrink-0">
                          {course!.teacherAvatarUrl ? (
                            <img
                              src={course!.teacherAvatarUrl}
                              className="w-full h-full object-cover"
                              alt={course!.teacherName}
                            />
                          ) : (
                            <User className="h-12 w-12 text-primary" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-slate-900 mb-1">
                            {course!.teacherName}
                          </h4>
                          <p className="text-primary font-bold text-sm tracking-wide bg-primary/5 inline-block px-3 py-1 rounded-full uppercase">
                            Professional Instruktor
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full">
                        <div className="bg-slate-50 p-6 rounded-3xl">
                          <p className="text-3xl font-black text-slate-900 mb-1">
                            {course!.reviews?.length || 0}
                          </p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Sharhlar
                          </p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl">
                          <p className="text-3xl font-black text-slate-900 mb-1">
                            {totalLessons}
                          </p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Darslar
                          </p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl">
                          <p className="text-3xl font-black text-slate-900 mb-1">
                            {course!.studentsCount ?? 0}
                          </p>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            O'quvchilar
                          </p>
                        </div>
                      </div>

                      <div className="prose prose-slate max-w-none bg-slate-50 p-8 rounded-3xl border-l-4 border-primary w-full">
                        <h5 className="font-bold text-xl mb-3">Bio</h5>
                        <p className="text-slate-600 leading-relaxed text-lg italic">
                          {course!.teacherBio ||
                            "Ushbu o'qituvchi haqida ma'lumot mavjud emas."}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="reviews"
                    className="mt-0 space-y-10 animate-in fade-in duration-500"
                  >
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        <h3 className="text-xl font-bold text-slate-900">
                          Talaba Sharhlari
                        </h3>
                      </div>

                      <div className="space-y-6">
                        {!course!.reviews || course!.reviews.length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed">
                            <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">
                              Hozircha sharhlar mavjud emas.
                            </p>
                          </div>
                        ) : (
                          course!.reviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="p-6 bg-slate-50 rounded-3xl space-y-4"
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary">
                                  {rev.userName?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">
                                    {rev.userName}
                                  </p>
                                  <p className="text-xs text-slate-400 font-medium">
                                    {new Date(
                                      rev.createdAt,
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="ml-auto flex gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className="h-3 w-3 text-yellow-500 fill-yellow-500"
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-slate-600 leading-relaxed">
                                {rev.text}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar Purchase Card */}
          <div className="lg:col-span-4 lg:-mt-32">
            <Card className="border-none shadow-2xl shadow-slate-300 rounded-[40px] overflow-hidden sticky top-24">
              {/* Thumbnail / Intro Video */}
              <div className="aspect-video relative group bg-black">
                {course!.introVideoUrl ? (
                  <video
                    src={course!.introVideoUrl}
                    className="w-full h-full object-contain"
                    controls
                    poster={course!.thumbnailUrl}
                  />
                ) : (
                  <>
                    <img
                      src={course!.thumbnailUrl}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      alt={course!.title}
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 scale-90 group-hover:scale-100 transition-transform duration-500">
                        <PlayCircle className="h-8 w-8 text-white fill-white/20" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <CardContent className="p-8 space-y-6">
                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <div className="text-4xl font-black text-slate-900">
                    {isFree ? (
                      <span className="text-emerald-600">Bepul</span>
                    ) : (
                      `${course!.price.toLocaleString()} so'm`
                    )}
                  </div>
                  {!isFree && course!.price > 0 && (
                    <span className="text-sm text-slate-400 line-through font-bold">
                      {(course!.price * 1.5).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* CTA section */}
                {isEnrolled ? (
                  /* Already enrolled & approved */
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-2xl p-3 text-sm font-bold">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Siz bu kursga a'zo siz
                    </div>
                    <Button
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg hover:bg-primary/90 shadow-xl shadow-primary/30"
                      onClick={() => navigate(`/learn/${courseId}`)}
                    >
                      <PlayCircle className="h-5 w-5 mr-2" />
                      O'qishni davom etish
                    </Button>
                  </div>
                ) : isPendingApproval ? (
                  /* Paid — awaiting admin approval */
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 font-bold">
                        <Clock className="h-4 w-4" />
                        Tasdiqlash kutilmoqda
                      </div>
                      <p className="text-amber-600/80 text-sm">
                        Chekingiz yuborildi. Admin tasdiqlashidan so'ng kurs
                        videolari ochiladi.
                      </p>
                    </div>
                  </div>
                ) : isFree ? (
                  /* FREE course: single button, no receipt */
                  <Button
                    className="w-full h-14 rounded-2xl bg-emerald-600 text-white font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-200/60 transition-all hover:translate-y-[-2px] active:translate-y-0"
                    onClick={handleFreeEnroll}
                    disabled={enrollMutation.isPending}
                  >
                    {enrollMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Gift className="h-5 w-5 mr-2" />
                        Bepul ro'yxatdan o'tish
                      </>
                    )}
                  </Button>
                ) : (
                  /* PAID: upload receipt then submit */
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />

                    {/* Receipt upload button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-14 rounded-2xl border-2 font-bold text-base flex items-center justify-center gap-2 transition-all ${
                        receipt
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-dashed border-slate-300 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      {receipt ? (
                        <>
                          <FileCheck className="h-5 w-5" />
                          {receipt.name.length > 22
                            ? receipt.name.slice(0, 22) + "…"
                            : receipt.name}
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          To'lov chekini yuklang
                        </>
                      )}
                    </button>

                    <Button
                      className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg hover:bg-primary/95 shadow-xl shadow-primary/30 transition-all hover:translate-y-[-2px] active:translate-y-0"
                      onClick={handlePaidEnroll}
                      disabled={enrollMutation.isPending}
                    >
                      {enrollMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Sotib olish
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-slate-400 font-medium">
                      To'lovdan keyin chek rasmini yuklang.
                      <br />
                      Admin tasdiqlashi bilan kurs ochiladi.
                    </p>
                  </div>
                )}

                {/* What's included */}
                <div className="space-y-4 pt-2 border-t">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Kursga nimalar kiradi:
                  </p>
                  <div className="space-y-3">
                    {[
                      {
                        icon: BookOpen,
                        text: `${(course!.modules || []).length} modul`,
                        color: "text-blue-500",
                      },
                      {
                        icon: PlayCircle,
                        text: `${totalLessons} video darslar`,
                        color: "text-primary",
                      },
                      {
                        icon: Award,
                        text: "Sertifikat beriladi",
                        color: "text-yellow-500",
                      },
                      {
                        icon: Info,
                        text: "Umrbod foydalanish",
                        color: "text-green-500",
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 text-sm font-bold text-slate-600"
                      >
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Spacer */}
      <div className="h-24"></div>
    </div>
  );
};

export default CourseDetails;
