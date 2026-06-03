import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  Video,
  FileText,
  GripVertical,
  Layers,
  Info,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CourseDto,
  ModuleDto,
  LessonDto,
  createCourse,
  updateCourse,
  uploadCourseThumbnail,
  uploadCourseVideo,
  getCourseDetails,
  createModule,
  updateModule,
  deleteModule as apiDeleteModule,
  createLesson,
  updateLesson as apiUpdateLesson,
  deleteLesson as apiDeleteLesson,
  uploadLessonVideo,
  uploadLessonSubtitles,
  uploadLessonAttachments,
} from "@/lib/teacher-api";
import Navbar from "@/components/Navbar";
import QuizEditor from "@/components/teacher/QuizEditor";
import ReflectionEditor from "@/components/teacher/ReflectionEditor";
import ReflectionGrader from "@/components/teacher/ReflectionGrader";
import AssignmentEditor from "@/components/teacher/AssignmentEditor";
import AssignmentGrader from "@/components/teacher/AssignmentGrader";

const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [course, setCourse] = useState<Partial<CourseDto>>({
    title: "",
    description: "",
    price: 0,
    category: "PROGRAMMING",
    language: "UZBEK",
    thumbnailUrl: "",
    status: "PENDING",
    modules: [],
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Auto-save draft to localStorage whenever course changes
  useEffect(() => {
    if (course.id && initialLoaded) {
      const draftKey = `course_draft_${course.id}`;
      localStorage.setItem(draftKey, JSON.stringify(course));
      // Small check to see if draft exists for UI
      setHasDraft(true);
    }
  }, [course, initialLoaded]);

  // Check for existing draft on load
  useEffect(() => {
    if (id) {
      const draft = localStorage.getItem(`course_draft_${id}`);
      if (draft) {
        setHasDraft(true);
      }
    }
  }, [id]);

  const restoreDraft = () => {
    const draft = localStorage.getItem(`course_draft_${id}`);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setCourse(parsedDraft);
        setInitialLoaded(true); // Don't let useEffect overwrite it
        toast.info("Qoralama tiklandi");
        setHasDraft(false);
      } catch (e) {
        localStorage.removeItem(`course_draft_${id}`);
        setHasDraft(false);
      }
    }
  };

  const clearDraft = () => {
    if (id) {
      localStorage.removeItem(`course_draft_${id}`);
      setHasDraft(false);
    }
  };

  // Basic info change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCourse((prev) => ({
      ...prev,
      [name]:
        name === "price" ? (value === "" ? 0 : parseFloat(value) || 0) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCourse((prev) => ({ ...prev, [name]: value }));
  };

  // Module Management
  const addModule = async () => {
    if (isEditing) {
      setProcessing("module-add");
      try {
        const newModuleData: Partial<ModuleDto> = {
          title: "Yangi Modul",
          lessons: [],
          moduleOrder: (course.modules?.length || 0) + 1,
          courseId: parseInt(id!),
        };

        const savedModule = await createModule(parseInt(id!), newModuleData);
        if (!savedModule) throw new Error("Serverdan noto'g'ri javob keldi");

        const moduleWithLessons = {
          ...savedModule,
          lessons: savedModule.lessons || [],
        };

        setCourse((prev) => {
          const updatedModules = [...(prev.modules || []), moduleWithLessons];
          const updatedCourse = {
            ...prev,
            modules: updatedModules,
          } as CourseDto;
          queryClient.setQueryData(
            ["teacher-course-details", id],
            updatedCourse,
          );
          // Also invalidate dashboard courses list to update counts
          queryClient.invalidateQueries({ queryKey: ["teacher-courses"] });
          return updatedCourse;
        });

        toast.success("Modul yaratildi");
      } catch (err: any) {
        toast.error("Modul yaratishda xatolik: " + (err?.message || ""));
      } finally {
        setProcessing(null);
      }
    } else {
      setCourse((prev) => ({
        ...prev,
        modules: [
          ...(prev.modules || []),
          {
            title: "Yangi Modul",
            lessons: [],
            moduleOrder: (prev.modules?.length || 0) + 1,
          } as ModuleDto,
        ],
      }));
    }
  };

  const updateModuleLocal = (index: number, field: string, value: any) => {
    setCourse((prev) => {
      const newModules = [...(prev.modules || [])];
      if (newModules[index]) {
        newModules[index] = { ...newModules[index], [field]: value };
      }
      return { ...prev, modules: newModules };
    });
  };

  const saveModuleChanges = async (index: number) => {
    if (!isEditing) return;

    const module = (course.modules || [])[index];
    if (module?.id) {
      try {
        await updateModule(module.id, {
          title: module.title,
          moduleOrder: module.moduleOrder,
          courseId: parseInt(id!),
        });
      } catch (err: any) {
        console.error("Module update failed:", err);
        toast.error("Modul ma'lumotlarini saqlashda xatolik");
      }
    }
  };

  const deleteModule = async (index: number) => {
    if (isEditing) {
      setCourse((prev) => {
        const module = (prev.modules || [])[index];
        if (!module) return prev;

        if (module.id) {
          if (
            !confirm(
              "Ushbu modul va undagi barcha darslar o'chiriladi. Ishonchingiz komilmi?",
            )
          )
            return prev;

          setProcessing(`module-delete-${module.id}`);
          apiDeleteModule(module.id)
            .then(() => {
              setCourse((current) => {
                const newModules = [...(current.modules || [])];
                newModules.splice(index, 1);
                const updatedCourse = {
                  ...current,
                  modules: newModules,
                } as CourseDto;
                queryClient.setQueryData(
                  ["teacher-course-details", id],
                  updatedCourse,
                );
                return updatedCourse;
              });
              toast.success("Modul o'chirildi");
            })
            .catch(() => {
              toast.error("O'chirishda xatolik");
            })
            .finally(() => {
              setProcessing(null);
            });
        }
        return prev;
      });
    } else {
      setCourse((prev) => {
        const newModules = [...(prev.modules || [])];
        newModules.splice(index, 1);
        return { ...prev, modules: newModules };
      });
    }
  };

  const addLesson = async (moduleIndex: number) => {
    if (isEditing) {
      setCourse((prev) => {
        const module = (prev.modules || [])[moduleIndex];
        if (!module?.id) return prev;

        setProcessing(`lesson-add-${module.id}`);

        const newLessonData: Partial<LessonDto> = {
          title: "Yangi Dars",
          lessonOrder: (module.lessons?.length || 0) + 1,
          courseId: parseInt(id!),
          moduleId: module.id,
        };

        createLesson(module.id, newLessonData)
          .then((savedLesson) => {
            setCourse((current) => {
              const newModules = JSON.parse(
                JSON.stringify(current.modules || []),
              );
              if (newModules[moduleIndex]) {
                if (!Array.isArray(newModules[moduleIndex].lessons)) {
                  newModules[moduleIndex].lessons = [];
                }
                newModules[moduleIndex].lessons.push(savedLesson);
              }
              const updatedCourse = {
                ...current,
                modules: newModules,
              } as CourseDto;
              queryClient.setQueryData(
                ["teacher-course-details", id],
                updatedCourse,
              );
              return updatedCourse;
            });
            toast.success("Dars qo'shildi");
          })
          .catch((err) => {
            toast.error("Dars qo'shishda xatolik: " + (err?.message || ""));
          })
          .finally(() => {
            setProcessing(null);
          });

        return prev;
      });
    } else {
      setCourse((prev) => {
        const newModules = JSON.parse(JSON.stringify(prev.modules || []));
        if (!newModules[moduleIndex]) return prev;
        if (!Array.isArray(newModules[moduleIndex].lessons)) {
          newModules[moduleIndex].lessons = [];
        }
        const newLessonData: Partial<LessonDto> = {
          title: "Yangi Dars",
          lessonOrder: newModules[moduleIndex].lessons.length + 1,
        };
        newModules[moduleIndex].lessons.push(newLessonData as LessonDto);
        return { ...prev, modules: newModules };
      });
    }
  };

  const updateLessonLocal = (
    moduleIndex: number,
    lessonIndex: number,
    field: string,
    value: any,
  ) => {
    setCourse((prev) => {
      const newModules = JSON.parse(JSON.stringify(prev.modules || []));
      if (newModules[moduleIndex]?.lessons[lessonIndex]) {
        newModules[moduleIndex].lessons[lessonIndex][field] = value;
      }
      return { ...prev, modules: newModules };
    });
  };

  const saveLessonChanges = async (
    moduleIndex: number,
    lessonIndex: number,
  ) => {
    if (!isEditing) return;

    const module = (course.modules || [])[moduleIndex];
    const lesson = module?.lessons[lessonIndex];
    if (lesson?.id && module?.id) {
      try {
        await apiUpdateLesson(lesson.id, {
          ...lesson,
          courseId: parseInt(id!),
          moduleId: module.id,
        });
      } catch (err: any) {
        console.error("Lesson update failed:", err);
        toast.error("Dars ma'lumotlarini saqlashda xatolik");
      }
    }
  };

  const deleteLesson = async (moduleIndex: number, lessonIndex: number) => {
    if (isEditing) {
      setCourse((prev) => {
        const module = (prev.modules || [])[moduleIndex];
        const lesson = module?.lessons[lessonIndex];
        if (!lesson?.id) return prev;

        if (!confirm("Ushbu darsni o'chirishni xohlaysizmi?")) return prev;

        setProcessing(`lesson-delete-${lesson.id}`);
        apiDeleteLesson(lesson.id)
          .then(() => {
            setCourse((current) => {
              const newModules = JSON.parse(
                JSON.stringify(current.modules || []),
              );
              if (newModules[moduleIndex]) {
                newModules[moduleIndex].lessons.splice(lessonIndex, 1);
              }
              const updatedCourse = {
                ...current,
                modules: newModules,
              } as CourseDto;
              queryClient.setQueryData(
                ["teacher-course-details", id],
                updatedCourse,
              );
              return updatedCourse;
            });
            toast.success("Dars o'chirildi");
          })
          .catch(() => {
            toast.error("O'chirishda xatolik");
          })
          .finally(() => {
            setProcessing(null);
          });

        return prev;
      });
    } else {
      setCourse((prev) => {
        const newModules = JSON.parse(JSON.stringify(prev.modules || []));
        if (newModules[moduleIndex]) {
          newModules[moduleIndex].lessons.splice(lessonIndex, 1);
        }
        return { ...prev, modules: newModules };
      });
    }
  };

  const handleThumbnailUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files?.[0] || !isEditing || !course.id) return;
    setUploading(true);
    try {
      const updated = await uploadCourseThumbnail(course.id, e.target.files[0]);
      setCourse((prev) => ({ ...prev, thumbnailUrl: updated.thumbnailUrl }));
      toast.success("Rasm yuklandi");
    } catch (err) {
      toast.error("Yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  const handleCourseVideoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files?.[0] || !isEditing || !course.id) return;
    setUploading(true);
    try {
      const updated = await uploadCourseVideo(course.id, e.target.files[0]);
      setCourse((prev) => ({ ...prev, introVideoUrl: updated.introVideoUrl }));
      toast.success("Intro video yuklandi");
    } catch (err) {
      toast.error("Video yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  const handleLessonVideoUpload = async (
    lessonId: number,
    moduleIndex: number,
    lessonIndex: number,
    file: File,
  ) => {
    setProcessing(`lesson-video-${lessonId}`);
    try {
      const updated = await uploadLessonVideo(lessonId, file);
      setCourse((prev) => {
        const newModules = JSON.parse(JSON.stringify(prev.modules || []));
        if (newModules[moduleIndex]?.lessons[lessonIndex]) {
          newModules[moduleIndex].lessons[lessonIndex].videoUrl =
            updated.videoUrl;
        }
        return { ...prev, modules: newModules };
      });
      toast.success("Video yuklandi");
    } catch (err) {
      toast.error("Video yuklashda xatolik");
    } finally {
      setProcessing(null);
    }
  };

  const handleLessonSubtitlesUpload = async (
    lessonId: number,
    moduleIndex: number,
    lessonIndex: number,
    file: File,
  ) => {
    setProcessing(`lesson-subtitles-${lessonId}`);
    try {
      const updated = await uploadLessonSubtitles(lessonId, file);
      setCourse((prev) => {
        const newModules = JSON.parse(JSON.stringify(prev.modules || []));
        if (newModules[moduleIndex]?.lessons[lessonIndex]) {
          newModules[moduleIndex].lessons[lessonIndex].subtitles =
            updated.subtitles;
        }
        return { ...prev, modules: newModules };
      });
      toast.success("Subtitr yuklandi");
    } catch (err) {
      toast.error("Subtitr yuklashda xatolik");
    } finally {
      setProcessing(null);
    }
  };

  const handleLessonAttachmentUpload = async (
    lessonId: number,
    moduleIndex: number,
    lessonIndex: number,
    file: File,
  ) => {
    setProcessing(`lesson-attachment-${lessonId}`);
    try {
      const updated = await uploadLessonAttachments(lessonId, [file]);
      setCourse((prev) => {
        const newModules = JSON.parse(JSON.stringify(prev.modules || []));
        if (newModules[moduleIndex]?.lessons[lessonIndex]) {
          newModules[moduleIndex].lessons[lessonIndex].fileUrls =
            updated.fileUrls;
        }
        return { ...prev, modules: newModules };
      });
      toast.success("Fayl yuklandi");
    } catch (err) {
      toast.error("Fayl yuklashda xatolik");
    } finally {
      setProcessing(null);
    }
  };

  const { data: fetchedCourse, isLoading: isDetailsLoading } = useQuery({
    queryKey: ["teacher-course-details", id],
    queryFn: () => getCourseDetails(parseInt(id!)),
    enabled: isEditing,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // Reset initialLoaded when ID changes to allow reloading new course data
    setInitialLoaded(false);
  }, [id]);

  useEffect(() => {
    // Set course from server on initial load
    // Only update if we haven't loaded yet OR if we don't have modules
    if (
      fetchedCourse &&
      (!initialLoaded ||
        (course.modules?.length === 0 && fetchedCourse.modules?.length > 0))
    ) {
      setCourse((prev) => {
        // Only overwrite if necessary to avoid losing local changes
        if (initialLoaded && prev.modules && prev.modules.length > 0)
          return prev;

        return {
          ...fetchedCourse,
          modules:
            fetchedCourse.modules?.map((m) => ({
              ...m,
              lessons: m.lessons || [],
            })) || [],
        };
      });
      setInitialLoaded(true);
    }
  }, [fetchedCourse, initialLoaded, course.modules?.length]);

  const queryClient = useQueryClient();

  const handleSave = async () => {
    try {
      // Clean course data before saving to avoid problematic fields
      const { modulesCount, teacherBio, ...courseToSave } = course;

      if (isEditing) {
        const updatedCourse = await updateCourse(
          parseInt(id!),
          courseToSave as CourseDto,
        );

        setCourse((prev) => ({
          ...updatedCourse,
          // CRITICAL: Merge modules - if server response is missing modules (common), keep our local fresh modules
          // CRITICAL: Merge modules - if server response is missing modules (common), keep our local fresh modules
          modules:
            updatedCourse.modules && Array.isArray(updatedCourse.modules)
              ? updatedCourse.modules.map((m) => ({
                  ...m,
                  lessons: m.lessons || [],
                }))
              : prev.modules,
        }));

        queryClient.setQueryData(["teacher-course-details", id], updatedCourse);
        clearDraft(); // Clear draft on successful manual save
        toast.success("Kurs muvaffaqiyatli yangilandi");
      } else {
        const newCourse = await createCourse(courseToSave as CourseDto);
        toast.success("Kurs yaratildi");
        navigate(`/teacher/courses/${newCourse.id}/edit`);
      }
    } catch (error: any) {
      const msg = error.message || "";
      if (msg.includes("429")) {
        toast.error(
          "Serverga juda ko'p so'rov yuborildi. Iltimos, biroz kutib turing.",
        );
      } else {
        toast.error("Xatolik yuz berdi: " + msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/teacher/dashboard">
                <ChevronLeft size={20} />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {isEditing ? "Kursni Tahrirlash" : "Yangi Kurs Yaratish"}
                </h1>
                {hasDraft && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={restoreDraft}
                    className="text-orange-600 h-auto p-0 flex items-center gap-1 font-semibold animate-pulse"
                  >
                    <Sparkles size={14} /> Qoralama bor (tiklash)
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Kurs ma'lumotlarini to'ldiring va o'quv rejasini shakllantiring.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/teacher/dashboard">Bekor qilish</Link>
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90"
            >
              <Save size={18} className="mr-2" />
              {isEditing ? "Yangilash" : "Yaratish"}
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-background border grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Info size={16} /> Asosiy Ma'lumotlar
            </TabsTrigger>
            <TabsTrigger value="curriculum" className="flex items-center gap-2">
              <Layers size={16} /> O'quv Rejasi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Kurs haqida</CardTitle>
                <CardDescription>
                  O'quvchilarga kursingiz nima haqida ekanligini aytib bering.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Kurs Nomi</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Masalan: React JS - Noldan Professionalgacha"
                    value={course.title}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Kurs Tavsifi</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Kurs mazmuni haqida batafsil..."
                    className="min-h-[150px]"
                    value={course.description}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategoriya</Label>
                    <Select
                      value={course.category}
                      onValueChange={(val) =>
                        handleSelectChange("category", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategoriyani tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PROGRAMMING">Dasturlash</SelectItem>
                        <SelectItem value="DESIGN">Design</SelectItem>
                        <SelectItem value="BUSINESS">Biznes</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="LANGUAGES">Tillar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Kurs Tili</Label>
                    <Select
                      value={course.language}
                      onValueChange={(val) =>
                        handleSelectChange("language", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tilni tanlang" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UZBEK">O'zbekcha</SelectItem>
                        <SelectItem value="ENGLISH">Inglizcha</SelectItem>
                        <SelectItem value="RUSSIAN">Ruscha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Narxi (so'm)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="0.00"
                      value={course.price}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Muqova rasmi</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="flex-1"
                        disabled={!isEditing || uploading}
                      />
                      {!isEditing && (
                        <p className="text-[10px] text-orange-600">
                          Avval kursni saqlang
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="introVideo">Intro Video</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="introVideo"
                        type="file"
                        accept="video/*"
                        onChange={handleCourseVideoUpload}
                        className="flex-1"
                        disabled={!isEditing || uploading}
                      />
                      {!isEditing && (
                        <p className="text-[10px] text-orange-600">
                          Avval kursni saqlang
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {course.thumbnailUrl && (
                    <div className="mt-4">
                      <Label className="block mb-2">Muqova Preview</Label>
                      <div className="aspect-video w-full rounded-lg border bg-muted overflow-hidden">
                        <img
                          src={course.thumbnailUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {course.introVideoUrl && (
                    <div className="mt-4">
                      <Label className="block mb-2">Intro Video Preview</Label>
                      <div className="aspect-video w-full rounded-lg border bg-black overflow-hidden relative">
                        <video
                          src={course.introVideoUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="curriculum" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">O'quv Rejasi</h2>
              <Button
                onClick={addModule}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={processing === "module-add"}
              >
                {processing === "module-add" ? "..." : <Plus size={16} />} Modul
                Qo'shish
              </Button>
            </div>

            <div className="space-y-4">
              {course.modules?.length === 0 ? (
                <Card className="border-dashed py-12 text-center bg-transparent">
                  <div className="flex flex-col items-center gap-2">
                    <Layers size={40} className="text-muted-foreground" />
                    <p className="text-muted-foreground">
                      O'quv rejasi hali bo'sh. Modul qo'shishni boshlang.
                    </p>
                    <Button
                      onClick={addModule}
                      variant="outline"
                      className="mt-2"
                      disabled={processing === "module-add"}
                    >
                      Birinchi Modulni Qo'shish
                    </Button>
                  </div>
                </Card>
              ) : (
                course.modules?.map((module, mIndex) => (
                  <Card
                    key={mIndex}
                    className="border shadow-sm overflow-hidden"
                  >
                    <div className="bg-muted/50 px-4 py-3 flex items-center justify-between border-b">
                      <div className="flex items-center gap-3 flex-1">
                        <GripVertical
                          size={16}
                          className="text-muted-foreground cursor-grab"
                        />
                        <span className="font-bold text-sm text-primary uppercase tracking-wider">
                          Modul {mIndex + 1}
                        </span>
                        <Input
                          className="h-8 py-0 bg-transparent border-none font-semibold text-base focus-visible:ring-0 max-w-[400px]"
                          value={module.title}
                          onChange={(e) =>
                            updateModuleLocal(mIndex, "title", e.target.value)
                          }
                          onBlur={() => saveModuleChanges(mIndex)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteModule(mIndex)}
                        className="text-destructive h-8 w-8"
                        disabled={processing === `module-delete-${module.id}`}
                      >
                        {processing === `module-delete-${module.id}` ? (
                          "..."
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="space-y-2">
                        {(module.lessons || []).map((lesson, lIndex) => (
                          <div
                            key={lIndex}
                            className="flex flex-col bg-background border p-4 rounded-lg group gap-4"
                          >
                            <div className="flex gap-3 items-start">
                              <div className="pt-2">
                                <CheckCircle2
                                  size={16}
                                  className="text-muted-foreground"
                                />
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Dars nomi</Label>
                                  <Input
                                    value={lesson.title}
                                    onChange={(e) =>
                                      updateLessonLocal(
                                        mIndex,
                                        lIndex,
                                        "title",
                                        e.target.value,
                                      )
                                    }
                                    onBlur={() =>
                                      saveLessonChanges(mIndex, lIndex)
                                    }
                                    className="h-8"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">
                                    Video / Media
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={lesson.videoUrl}
                                      onChange={(e) =>
                                        updateLessonLocal(
                                          mIndex,
                                          lIndex,
                                          "videoUrl",
                                          e.target.value,
                                        )
                                      }
                                      onBlur={() =>
                                        saveLessonChanges(mIndex, lIndex)
                                      }
                                      className="h-8 flex-1"
                                      placeholder="https://..."
                                    />
                                    <div className="flex gap-1">
                                      <Label
                                        className="cursor-pointer"
                                        title="Video yuklash"
                                      >
                                        <div className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors h-8 flex items-center justify-center min-w-[32px]">
                                          {processing ===
                                          `lesson-video-${lesson.id}` ? (
                                            "..."
                                          ) : (
                                            <Video size={14} />
                                          )}
                                        </div>
                                        <input
                                          type="file"
                                          accept="video/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            if (
                                              e.target.files?.[0] &&
                                              lesson.id
                                            ) {
                                              handleLessonVideoUpload(
                                                lesson.id,
                                                mIndex,
                                                lIndex,
                                                e.target.files[0],
                                              );
                                            }
                                          }}
                                        />
                                      </Label>
                                      <Label
                                        className="cursor-pointer"
                                        title="Subtitr yuklash (.vtt)"
                                      >
                                        <div className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 p-2 rounded-lg transition-colors h-8 flex items-center justify-center min-w-[32px]">
                                          {processing ===
                                          `lesson-subtitles-${lesson.id}` ? (
                                            "..."
                                          ) : (
                                            <span className="text-[10px] font-bold">
                                              CC
                                            </span>
                                          )}
                                        </div>
                                        <input
                                          type="file"
                                          accept=".vtt"
                                          className="hidden"
                                          onChange={(e) => {
                                            if (
                                              e.target.files?.[0] &&
                                              lesson.id
                                            ) {
                                              handleLessonSubtitlesUpload(
                                                lesson.id,
                                                mIndex,
                                                lIndex,
                                                e.target.files[0],
                                              );
                                            }
                                          }}
                                        />
                                      </Label>
                                      <Label
                                        className="cursor-pointer"
                                        title="Fayl yuklash"
                                      >
                                        <div className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 p-2 rounded-lg transition-colors h-8 flex items-center justify-center min-w-[32px]">
                                          {processing ===
                                          `lesson-attachment-${lesson.id}` ? (
                                            "..."
                                          ) : (
                                            <FileText size={14} />
                                          )}
                                        </div>
                                        <input
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => {
                                            if (
                                              e.target.files?.[0] &&
                                              lesson.id
                                            ) {
                                              handleLessonAttachmentUpload(
                                                lesson.id,
                                                mIndex,
                                                lIndex,
                                                e.target.files[0],
                                              );
                                            }
                                          }}
                                        />
                                      </Label>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {lesson.subtitles && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] h-4 gap-1"
                                      >
                                        <CheckCircle2 size={10} /> Subtitr
                                      </Badge>
                                    )}
                                    {lesson.fileUrls &&
                                      lesson.fileUrls.length > 0 && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] h-4 gap-1"
                                        >
                                          <CheckCircle2 size={10} />{" "}
                                          {lesson.fileUrls.length} fayl
                                        </Badge>
                                      )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteLesson(mIndex, lIndex)}
                                  className="text-destructive h-8 w-8"
                                  disabled={
                                    processing === `lesson-delete-${lesson.id}`
                                  }
                                >
                                  {processing ===
                                  `lesson-delete-${lesson.id}` ? (
                                    "..."
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {lesson.id && (
                              <div className="pt-2 border-t flex justify-end">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-2"
                                    >
                                      <BrainCircuit className="h-4 w-4" />
                                      Testni tahrirlash
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Dars testi: {lesson.title}
                                      </DialogTitle>
                                    </DialogHeader>
                                    <QuizEditor lessonId={lesson.id} />
                                  </DialogContent>
                                </Dialog>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-2 border-primary/20 hover:border-primary/50 text-primary"
                                    >
                                      <Sparkles className="h-4 w-4" />
                                      Refleksiya
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <Tabs
                                      defaultValue="edit"
                                      className="w-full"
                                    >
                                      <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="edit">
                                          Savollar
                                        </TabsTrigger>
                                        <TabsTrigger value="submissions">
                                          Baholash
                                        </TabsTrigger>
                                      </TabsList>
                                      <TabsContent
                                        value="edit"
                                        className="mt-4"
                                      >
                                        <ReflectionEditor
                                          lessonId={lesson.id}
                                        />
                                      </TabsContent>
                                      <TabsContent
                                        value="submissions"
                                        className="mt-4"
                                      >
                                        <ReflectionGrader
                                          lessonId={lesson.id}
                                        />
                                      </TabsContent>
                                    </Tabs>
                                  </DialogContent>
                                </Dialog>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-2 border-orange-500/20 hover:border-orange-500/50 text-orange-600"
                                    >
                                      <FileText className="h-4 w-4" />
                                      Topshiriq
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                    <Tabs
                                      defaultValue="edit"
                                      className="w-full"
                                    >
                                      <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="edit">
                                          Vazifa
                                        </TabsTrigger>
                                        <TabsTrigger value="submissions">
                                          Tekshirish
                                        </TabsTrigger>
                                      </TabsList>
                                      <TabsContent
                                        value="edit"
                                        className="mt-4"
                                      >
                                        <AssignmentEditor
                                          lessonId={lesson.id}
                                        />
                                      </TabsContent>
                                      <TabsContent
                                        value="submissions"
                                        className="mt-4"
                                      >
                                        <AssignmentGrader
                                          lessonId={lesson.id}
                                        />
                                      </TabsContent>
                                    </Tabs>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addLesson(mIndex)}
                        className="w-full border-dashed border-2 text-muted-foreground hover:text-foreground"
                        disabled={processing === `lesson-add-${module.id}`}
                      >
                        {processing === `lesson-add-${module.id}` ? (
                          "Dars qo'shilmoqda..."
                        ) : (
                          <>
                            <Plus size={14} className="mr-2" /> Dars Qo'shish
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="pt-4 flex justify-between border-t mt-8">
              <Button variant="outline" onClick={() => setActiveTab("basic")}>
                Oldingi
              </Button>
              <Button onClick={handleSave}>
                {isEditing ? "O'zgarishlarni Saqlash" : "Kursni Yaratish"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CourseEditor;
