import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLessonAssignment,
  updateAssignment,
  deleteAssignment,
  getLessonSubmissions,
  getLessonAssignment,
  gradeSubmission,
  AssignmentDto,
  AssignmentSubmissionDto as SubmissionDto,
} from "@/lib/teacher-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Save,
  Send,
  User,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface AssignmentEditorProps {
  lessonId: number;
}

const AssignmentEditor: React.FC<AssignmentEditorProps> = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AssignmentDto>>({
    title: "Mustaqil topshiriq",
    description: "",
  });

  const { data: existingAssignment, isLoading } = useQuery({
    queryKey: ["teacher-lesson-assignment", lessonId],
    queryFn: () => getLessonAssignment(lessonId).catch(() => null),
  });

  useEffect(() => {
    if (existingAssignment) {
      setFormData(existingAssignment);
    }
  }, [existingAssignment]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<AssignmentDto>) =>
      existingAssignment?.id
        ? updateAssignment(existingAssignment.id, data)
        : createLessonAssignment(lessonId, data),
    onSuccess: () => {
      toast.success("Topshiriq saqlandi");
      queryClient.invalidateQueries({
        queryKey: ["teacher-lesson-assignment", lessonId],
      });
    },
    onError: (err: any) => toast.error(err.message || "Saqlashda xatolik"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAssignment(existingAssignment!.id!),
    onSuccess: () => {
      toast.success("Topshiriq o'chirildi");
      queryClient.invalidateQueries({
        queryKey: ["teacher-lesson-assignment", lessonId],
      });
      setFormData({ title: "Mustaqil topshiriq", description: "" });
    },
    onError: (err: any) => toast.error(err.message || "O'chirishda xatolik"),
  });

  if (isLoading) return <div className="py-8 text-center">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pt-0">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Topshiriq yaratish</CardTitle>
              <CardDescription>
                Ushbu dars uchun talabalarga beriladigan vazifani yozing.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {existingAssignment?.id && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Topshiriqni o'chirishni xohlaysizmi?"))
                      deleteMutation.mutate();
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  O'chirish
                </Button>
              )}
              <Button
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Saqlash
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="as-title">Topshiriq nomi</Label>
            <Input
              id="as-title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="as-desc">Vazifa matni</Label>
            <Textarea
              id="as-desc"
              placeholder="Vazifa shartlarini batafsil tushuntiring..."
              className="min-h-[150px]"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentEditor;
