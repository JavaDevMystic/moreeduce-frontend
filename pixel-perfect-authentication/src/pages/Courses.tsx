import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchCourses, type CourseSearchQuery } from "@/lib/student-api";
import { useDebounce } from "@/hooks/use-debounce";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, BookOpen, Loader2, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = [
  { value: "ALL", label: "Barchasi" },
  { value: "PROGRAMMING", label: "Dasturlash" },
  { value: "DESIGN", label: "Dizayn" },
  { value: "BUSINESS", label: "Biznes" },
  { value: "MARKETING", label: "Marketing" },
  { value: "LANGUAGES", label: "Tillar" },
];

const LANGUAGES = [
  { value: "ALL", label: "Barcha tillar" },
  { value: "UZBEK", label: "O'zbekcha" },
  { value: "ENGLISH", label: "Inglizcha" },
  { value: "RUSSIAN", label: "Ruscha" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Eng yangi" },
  { value: "price-low", label: "Narx: arzon → qimmat" },
  { value: "price-high", label: "Narx: qimmat → arzon" },
  { value: "popular", label: "Ommabop" },
];

const Courses = () => {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 500);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const query: CourseSearchQuery = {
    ...(debouncedSearchText && { search: debouncedSearchText }),
    ...(selectedCategory !== "ALL" && { category: selectedCategory }),
    ...(selectedLanguage !== "ALL" && { language: selectedLanguage }),
    ...(minPrice && { minPrice: parseFloat(minPrice) }),
    ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
  };

  const {
    data: courses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["courses-browse", query],
    queryFn: () => searchCourses(query),
  });

  const courseList = Array.isArray(courses?.content)
    ? courses.content
    : Array.isArray(courses)
      ? (courses as any[])
      : [];
  const sortedCourses =
    courseList.length > 0
      ? [...courseList].sort((a, b) => {
          switch (sortBy) {
            case "price-low":
              return a.price - b.price;
            case "price-high":
              return b.price - a.price;
            case "popular":
              return (b.studentsCount || 0) - (a.studentsCount || 0);
            default:
              return b.id - a.id;
          }
        })
      : [];

  const hasActiveFilters =
    selectedCategory !== "ALL" ||
    selectedLanguage !== "ALL" ||
    searchText ||
    minPrice ||
    maxPrice;

  const clearFilters = () => {
    setSearchText("");
    setSelectedCategory("ALL");
    setSelectedLanguage("ALL");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/10 blur-[150px] rounded-full translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-500/10 blur-[100px] rounded-full -translate-x-1/4"></div>

        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-2xl space-y-6">
            <p className="text-primary text-xs font-bold uppercase tracking-[0.3em]">
              Kurslar katalogi
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              Barcha <span className="text-primary">Kurslar</span>
            </h1>
            <p className="text-slate-400 text-lg">
              O'zingizga mos kursni toping va bugundan o'rganishni boshlang.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-10 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Kurs nomi, kategoriya yoki o'qituvchi bo'yicha qidiring..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-14 pl-14 pr-14 rounded-2xl bg-white/10 border-white/10 text-white placeholder:text-slate-500 text-base font-medium focus:bg-white/15 focus:border-primary/50 transition-all"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Results */}
      <section className="max-w-7xl mx-auto px-4 w-full py-10 flex-1">
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8">
          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.value
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "rounded-xl font-bold gap-2 h-10 transition-all",
                showFilters && "bg-slate-100 border-slate-300",
              )}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtr
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px] h-10 rounded-xl font-bold text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="font-medium"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-xl font-bold text-red-500 hover:text-red-600 hover:bg-red-50 gap-1 h-10"
              >
                <X className="h-3 w-3" />
                Tozalash
              </Button>
            )}
          </div>
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 mb-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full"></div>

            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">
                Kurs Tili
              </label>
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger className="h-12 rounded-2xl font-bold bg-white border-slate-200 focus:ring-primary/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100">
                  {LANGUAGES.map((lang) => (
                    <SelectItem
                      key={lang.value}
                      value={lang.value}
                      className="font-bold py-3"
                    >
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 relative z-10">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">
                Narx Oralig'i (so'm)
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="h-12 px-4 rounded-2xl bg-white border-slate-200 font-bold placeholder:font-medium placeholder:text-slate-300 focus:ring-primary/20 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 pointer-events-none group-focus-within:text-primary transition-colors uppercase">
                    Min
                  </span>
                </div>
                <div className="relative flex-1 group">
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="h-12 px-4 rounded-2xl bg-white border-slate-200 font-bold placeholder:font-medium placeholder:text-slate-300 focus:ring-primary/20 transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 pointer-events-none group-focus-within:text-primary transition-colors uppercase">
                    Max
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            {isLoading
              ? "Qidirilmoqda..."
              : `${sortedCourses.length} ta natija topildi`}
          </p>
          {hasActiveFilters && (
            <div className="flex gap-2">
              {searchText && (
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-600 font-bold rounded-lg px-3 py-1"
                >
                  Qidiruv: {searchText}
                </Badge>
              )}
              {selectedCategory !== "ALL" && (
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary font-bold rounded-lg px-3 py-1"
                >
                  {CATEGORIES.find((c) => c.value === selectedCategory)?.label}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Kurslar yuklanmoqda...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-red-50 rounded-[40px] border border-red-100">
            <p className="text-red-500 font-bold mb-4">
              Kurslarni yuklashda xatolik yuz berdi.
            </p>
            <Button
              variant="outline"
              className="rounded-2xl h-12 px-8 border-red-200 hover:bg-red-100 text-red-600 transition-all"
              onClick={clearFilters}
            >
              Qayta urinish
            </Button>
          </div>
        ) : sortedCourses.length === 0 ? (
          <div className="text-center py-24 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-200">
            <BookOpen className="h-16 w-16 text-slate-200 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Kurs topilmadi
            </h3>
            <p className="text-slate-400 mb-8 max-w-xs mx-auto">
              Boshqa kalit so'z yoki kategoriya bilan qidirib ko'ring.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="rounded-2xl h-12 px-8 font-bold border-slate-200 hover:bg-slate-100 transition-all"
                onClick={clearFilters}
              >
                Filtrlarni tozalash
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {sortedCourses.map((course) => (
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

      <Footer />
    </div>
  );
};

export default Courses;
