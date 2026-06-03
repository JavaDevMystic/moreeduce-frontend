import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessonSubmissions,
  gradeSubmission,
  getLessonAssignment,
  AssignmentSubmissionDto as SubmissionDto,
} from "@/lib/teacher-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle2, MessageSquare, FileText } from "lucide-react";
import { toast } from "sonner";

interface AssignmentGraderProps {
  lessonId: number;
}

const AssignmentGrader: React.FC<AssignmentGraderProps> = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("all");
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: assignment, isLoading: isAssLoading } = useQuery({
    queryKey: ["teacher-lesson-assignment", lessonId],
    queryFn: () => getLessonAssignment(lessonId).catch(() => null),
  });

  const assignmentId = assignment?.id;

  const { data: submissions = [], isLoading: isSubLoading } = useQuery({
    queryKey: ["assignment-submissions", assignmentId],
    queryFn: () => getLessonSubmissions(assignmentId!),
    enabled: !!assignmentId,
  });

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === "pending") return sub.grade === null;
    if (filter === "graded") return sub.grade !== null;
    return true;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.grade === null).length,
    graded: submissions.filter((s) => s.grade !== null).length,
  };

  const gradeMutation = useMutation({
    mutationFn: ({
      subId,
      grade,
      feedback,
    }: {
      subId: number;
      grade: number;
      feedback: string;
    }) => gradeSubmission(subId, grade, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["assignment-submissions", assignmentId],
      });
      setEditingId(null);
      toast.success("Muvaffaqiyatli baholandi!");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  if (isAssLoading || (assignmentId && isSubLoading))
    return (
      <div className="py-20 text-center">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
          Yuklanmoqda...
        </p>
      </div>
    );

  if (!assignment) {
    return (
      <div className="py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
        <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-600">
          Topshiriq topilmadi
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
          Ushbu dars uchun topshiriq hali yaratilmagan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats and Headers */}
      <div className="bg-slate-50/50 p-4 rounded-[28px] border border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 pl-2">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Jami
            </p>
            <p className="text-lg font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
              Kutilmoqda
            </p>
            <p className="text-lg font-black text-slate-900 tracking-tighter">
              {stats.pending}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">
              Bajarildi
            </p>
            <p className="text-lg font-black text-slate-900 tracking-tighter">
              {stats.graded}
            </p>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
          {[
            { id: "all", label: "Barchasi" },
            { id: "pending", label: "Kutilmoqda" },
            { id: "graded", label: "Baholangan" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                filter === btn.id
                  ? "bg-black text-white shadow-xl shadow-black/10"
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-[32px] border border-slate-100 flex flex-col items-center">
          <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-slate-200" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            {filter === "all"
              ? "Hozircha topshirilgan topshiriqlar yo'q."
              : filter === "pending"
                ? "Barcha topshiriqlar baholab bo'lingan!"
                : "Hali hech qanday topshiriq baholanmagan."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredSubmissions.map((sub: SubmissionDto) => (
            <Card
              key={sub.id}
              className={`overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] bg-white ring-1 ring-slate-100 ${
                sub.grade === null ? "ring-orange-400/20" : ""
              }`}
            >
              <div className="bg-slate-50/30 border-b border-slate-50 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 flex items-center justify-center text-orange-600 shadow-inner">
                    <User className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-lg">
                      {sub.studentName || "Noma'lum Talaba"}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                      Topshirilgan:{" "}
                      {sub.submittedAt
                        ? new Date(sub.submittedAt).toLocaleDateString()
                        : "Noma'lum"}
                    </p>
                  </div>
                </div>
                <div>
                  {sub.grade !== null ? (
                    <Badge className="bg-green-500 text-white border-none font-black text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-full shadow-sm shadow-green-500/20">
                      Baholangan: {sub.grade}%
                    </Badge>
                  ) : (
                    <Badge className="bg-orange-400 text-white border-none font-black text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-full shadow-sm shadow-orange-400/20 animate-pulse">
                      Kutilmoqda
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-slate-300" />
                    Talaba javobi
                  </Label>
                  <div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {sub.submissionContent || "Mazmun yo'q"}
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        O'qituvchi fikri
                      </Label>
                      {sub.grade !== null && editingId !== sub.id ? (
                        <p className="text-sm text-slate-600 italic bg-blue-50/30 p-4 rounded-2xl border border-blue-50">
                          {sub.teacherFeedback || "Fikr qoldirilmagan"}
                        </p>
                      ) : (
                        <Textarea
                          placeholder="O'quvchiga tavsiyalaringizni yozing..."
                          className="min-h-[100px] rounded-2xl border-slate-200 focus:border-orange-500 focus:ring-orange-500/10 transition-all text-sm font-medium"
                          defaultValue={sub.teacherFeedback || ""}
                          id={`feedback-${sub.id}`}
                        />
                      )}
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Baho (0-100)
                        </Label>
                        {sub.grade !== null && editingId !== sub.id ? (
                          <div className="flex items-center gap-4">
                            <span className="text-4xl font-black text-orange-600 tracking-tighter">
                              {sub.grade}%
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-10 px-4 rounded-xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 font-black text-[10px] uppercase tracking-widest transition-all"
                              onClick={() => setEditingId(sub.id!)}
                            >
                              Tahrirlash
                            </Button>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              className="h-14 rounded-2xl border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 font-black text-2xl text-center shadow-inner transition-all"
                              defaultValue={sub.grade || 0}
                              id={`grade-${sub.id}`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">
                              %
                            </span>
                          </div>
                        )}
                      </div>

                      {(sub.grade === null || editingId === sub.id) && (
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 rounded-2xl h-14 bg-black hover:bg-slate-800 text-white font-black text-sm gap-2 shadow-2xl shadow-black/20 transition-all active:scale-95"
                            disabled={gradeMutation.isPending}
                            onClick={() => {
                              const gradeInp = document.getElementById(
                                `grade-${sub.id}`,
                              ) as HTMLInputElement;
                              const feedbackInp = document.getElementById(
                                `feedback-${sub.id}`,
                              ) as HTMLTextAreaElement;
                              if (gradeInp && feedbackInp) {
                                const grade = parseInt(gradeInp.value);
                                if (isNaN(grade) || grade < 0 || grade > 100) {
                                  toast.error(
                                    "Baho 0 va 100 orasida bo'lishi kerak",
                                  );
                                  return;
                                }
                                gradeMutation.mutate({
                                  subId: sub.id!,
                                  grade,
                                  feedback: feedbackInp.value,
                                });
                              }
                            }}
                          >
                            {gradeMutation.isPending ? (
                              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-5 w-5" />
                                Saqlash
                              </>
                            )}
                          </Button>
                          {editingId === sub.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-14 rounded-2xl px-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900"
                              onClick={() => setEditingId(null)}
                            >
                              Bekor
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentGrader;
