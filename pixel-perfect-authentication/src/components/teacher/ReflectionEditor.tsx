import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessonReflection,
  createLessonReflection,
  updateReflection,
  deleteReflection,
  getReflectionSubmissions,
  gradeReflectionSubmission,
  ReflectionDto,
  ReflectionResultDto as ReflectionSubmissionDto,
} from "@/lib/teacher-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, Sparkles, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ReflectionEditorProps {
  lessonId: number;
}

const ReflectionEditor: React.FC<ReflectionEditorProps> = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const { data: reflection, isLoading } = useQuery({
    queryKey: ["lesson-reflection", lessonId],
    queryFn: () => getLessonReflection(lessonId).catch(() => null),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["reflection-submissions", reflection?.id],
    queryFn: () => getReflectionSubmissions(reflection!.id!),
    enabled: !!reflection?.id,
  });

  const [formData, setFormData] = useState<Partial<ReflectionDto>>({
    title: "Dars bo'yicha refleksiya",
    question1: "",
    question2: "",
    question3: "",
    question4: "",
  });

  useEffect(() => {
    if (reflection) {
      setFormData(reflection);
    }
  }, [reflection]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<ReflectionDto>) =>
      reflection?.id
        ? updateReflection(reflection.id, data)
        : createLessonReflection(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-reflection", lessonId],
      });
      toast.success("Refleksiya saqlandi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteReflection(reflection!.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-reflection", lessonId],
      });
      setFormData({
        title: "Dars bo'yicha refleksiya",
        question1: "",
        question2: "",
        question3: "",
        question4: "",
      });
      toast.success("Refleksiya o'chirildi");
    },
  });

  const gradeMutation = useMutation({
    mutationFn: ({
      submissionId,
      score,
    }: {
      submissionId: number;
      score: number;
    }) => gradeReflectionSubmission(submissionId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reflection-submissions", reflection?.id],
      });
      toast.success("Baholandi!");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (
      !formData.question1 ||
      !formData.question2 ||
      !formData.question3 ||
      !formData.question4
    ) {
      return toast.error("Barcha 4 ta savolni to'ldiring");
    }
    saveMutation.mutate({ ...formData, lessonId });
  };

  if (isLoading)
    return (
      <div className="py-8 text-center text-muted-foreground">
        Yuklanmoqda...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1 flex-1">
          <Label>Refleksiya Sarlavhasi</Label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="text-lg font-bold"
            placeholder="Masalan: Bugungi dars xulosasi"
          />
        </div>
        <div className="flex items-center gap-3">
          {reflection?.id && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Refleksiyani o'chirishni xohlaysizmi?"))
                  deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              O'chirish
            </Button>
          )}
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Saqlash
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {[1, 2, 3, 4].map((num) => (
          <Card key={num} className="border-primary/10 shadow-sm">
            <CardHeader className="py-3 px-4 bg-primary/5 border-b border-primary/10">
              <CardTitle className="text-sm flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                Savol {num}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Sizning savolingiz
                </Label>
                <Input
                  name={`question${num}` as keyof ReflectionDto}
                  value={(formData as any)[`question${num}`]}
                  onChange={handleInputChange}
                  placeholder={`Masalan: ${num === 1 ? "Bugun nimalarni o'rgandingiz?" : num === 2 ? "Qaysi mavzu sizga qiyinlik qildi?" : num === 3 ? "O'rganganlaringizni qayerda qo'llashingiz mumkin?" : "Keyingi darsdan nimalarni kutyapsiz?"}`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
        <p className="text-xs text-orange-800 leading-relaxed">
          <strong>Eslatma:</strong> Refleksiya talabalarga darsni tugatgandan
          so'ng ko'rsatiladi. Bu ularga o'zlashtirish darajasini tahlil qilishga
          yordam beradi.
        </p>
      </div>
    </div>
  );
};

export default ReflectionEditor;
