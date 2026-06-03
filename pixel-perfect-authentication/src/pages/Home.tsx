import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAllCourses } from "@/lib/student-api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-student.jpg";
import { BookOpen, GraduationCap, Users, Award, Loader2 } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const {
    data: coursesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["home-courses"],
    queryFn: () => getAllCourses(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const courses = coursesResponse?.content ?? [];

  const stats = useMemo(() => {
    const totalStudents = courses.reduce(
      (sum, c) => sum + (c.studentsCount || 0),
      0,
    );
    const totalCourses = coursesResponse?.totalElements ?? courses.length;
    const uniqueTeachers = new Set(
      courses.map((c) => c.teacherName).filter(Boolean),
    ).size;

    return [
      {
        value: totalStudents.toLocaleString(),
        label: "Aktiv Studentlar",
        icon: Users,
      },
      { value: String(totalCourses), label: "Mavjud Kurslar", icon: BookOpen },
      {
        value: String(uniqueTeachers),
        label: "Instruktor",
        icon: GraduationCap,
      },
      { value: "100%", label: "Qoniqish Darajasi", icon: Award },
    ];
  }, [courses, coursesResponse]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white pb-16 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="py-16 md:py-32 md:w-1/2 z-10 space-y-6">
            <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full">
              <span className="text-primary text-xs font-bold uppercase tracking-widest">
                Sifatli ta'lim platformasi
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-4">
              <span className="text-primary">MoreEduce</span> Bilan
              <br />
              Kelajagingizni Birga
              <br />
              Bunyod Etamiz.
            </h1>
            <p className="text-lg text-slate-600 max-w-lg">
              O'zbekistondagi eng zamonaviy va qulay online ta'lim platformasi.
              Biz bilan hammasi oson, tez va samarali.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="rounded-full shadow-xl shadow-primary/20 px-8 h-12 text-base font-bold"
                onClick={() => navigate("/courses")}
              >
                Kurslarni ko'rish
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base font-bold bg-white"
              >
                Biz haqimizda
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 relative">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-20"></div>
            <img
              src={heroImg}
              alt="Student"
              className="w-full h-[400px] md:h-[600px] object-cover rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 w-full -mt-12 mb-20 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center p-6 text-center group hover:bg-slate-50 rounded-2xl transition-colors"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mb-1">
                {s.value}
              </p>
              <p className="text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section className="max-w-7xl mx-auto px-4 py-12 w-full mb-20">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">
              Ommabop kurslar
            </h2>
            <h2 className="text-4xl font-extrabold text-slate-900">
              Eng so'nggi kurslarimiz
            </h2>
          </div>
          <Button
            variant="ghost"
            className="rounded-full font-bold text-primary hover:bg-primary/5"
            onClick={() => navigate("/courses")}
          >
            Barcha kurslar
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Kurslar yuklanmoqda...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-50 rounded-3xl">
            <p className="text-red-500 font-medium">
              Kurslarni yuklashda xatolik yuz berdi.
            </p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl">
            <BookOpen className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">
              Hozircha kurslar mavjud emas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                thumbnailUrl={course.thumbnailUrl}
                category={course.category}
                price={course.price}
                teacherName={course.teacherName}
                studentsCount={course.studentsCount}
                modulesCount={
                  course.modulesCount || course.modules?.length || 0
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Add-ons Banner */}
      <section className="max-w-7xl mx-auto px-4 w-full mb-20">
        <div className="bg-slate-900 rounded-[40px] p-10 md:p-20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/20 blur-[120px] rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 max-w-2xl">
            <h3 className="text-white text-4xl md:text-5xl font-extrabold mb-6">
              Biz bilan o'z kelajagingizni bugundan boshlang
            </h3>
            <p className="text-slate-400 text-lg mb-8">
              Minglab talabalar kabi siz ham o'z sohangizda professional
              bo'ling. Dunyo standartlari asosidagi kurslar.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base font-bold bg-primary hover:bg-primary/90"
              >
                Hoziroq boshlash
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base font-bold border-white/20 text-blue-500 hover:bg-blue/10"
              >
                Yana ma'lumot
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Education Theme Banner */}
      <section className="max-w-7xl mx-auto px-4 w-full mb-24">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-[40px] p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase mb-4 text-blue-200 tracking-widest">
              O'qituvchilar uchun
            </p>
            <h3 className="text-4xl font-extrabold mb-6 text-white max-w-2xl mx-auto">
              Siz ham o'z bilimlaringiz bilan bo'lishing
            </h3>
            <p className="text-lg mb-8 max-w-xl mx-auto text-blue-100">
              O'qituvchi sifatida ro'yxatdan o'ting va o'z kurslaringizni butun
              mamlakatga soting.
            </p>
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-lg font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-2xl"
            >
              Instruktor bo'lish
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
