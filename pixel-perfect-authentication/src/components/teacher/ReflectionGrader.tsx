import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessonReflection,
  getReflectionSubmissions,
  gradeReflectionSubmission,
  ReflectionResultDto as ReflectionSubmissionDto,
} from "@/lib/teacher-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ReflectionGraderProps {
  lessonId: number;
}

const ReflectionGrader: React.FC<ReflectionGraderProps> = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "graded">("all");
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: reflection, isLoading: isRefLoading } = useQuery({
    queryKey: ["lesson-reflection", lessonId],
    queryFn: () => getLessonReflection(lessonId).catch(() => null),
  });

  const {
    data: submissions = [],
    isLoading: isSubLoading,
    isError: isSubError,
    error: subError,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["reflection-submissions", reflection?.id],
    queryFn: () => getReflectionSubmissions(reflection!.id!),
    enabled: !!reflection?.id,
  });

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === "pending") return sub.status !== "GRADED";
    if (filter === "graded") return sub.status === "GRADED";
    return true;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status !== "GRADED").length,
    graded: submissions.filter((s) => s.status === "GRADED").length,
  };

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
      setEditingId(null);
      toast.success("Muvaffaqiyatli baholandi!");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  if (isRefLoading || (reflection?.id && isSubLoading))
    return (
      <div className="py-20 text-center">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">
          Yuklanmoqda...
        </p>
      </div>
    );

  if (!reflection) {
    return (
      <div className="py-12 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
        <Sparkles className="h-12 w-12 text-slate-200 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-600">
          Refleksiya topilmadi
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
          Ushbu dars uchun refleksiya savollari hali yaratilmagan.
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
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
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

        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm items-center gap-1">
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
          <div className="w-px h-6 bg-slate-100 mx-1" />
          <button
            onClick={() => refetchSubmissions()}
            className="p-2 text-slate-400 hover:text-primary transition-colors rounded-xl hover:bg-slate-50"
            title="Yangilash"
          >
            <Loader2
              className={`h-4 w-4 ${isSubLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          Refleksiya ID: #{reflection?.id || "Noma'lum"} | Dars ID: #{lessonId}
        </p>
      </div>

      {isSubError ? (
        <div className="py-24 text-center bg-red-50/20 rounded-[32px] border border-dashed border-red-200 flex flex-col items-center">
          <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-black text-red-600">Xatolik yuz berdi</h3>
          <p className="text-xs text-red-500 font-medium max-w-xs mx-auto mt-2">
            {(subError as any)?.message ||
              "Javoblarni yuklashda xatolik yuz berdi."}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-6 rounded-2xl border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => refetchSubmissions()}
          >
            Qayta urinish
          </Button>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-[32px] border border-slate-100 flex flex-col items-center">
          <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-slate-200" />
          </div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-xs">
            {filter === "all"
              ? "Hozircha topshirilgan refleksiyalar yo'q."
              : filter === "pending"
                ? "Barcha refleksiyalar baholab bo'lingan!"
                : "Hali hech qanday refleksiya baholanmagan."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredSubmissions.map((sub: ReflectionSubmissionDto) => (
            <Card
              key={sub.id}
              className={`overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[32px] bg-white ring-1 ring-slate-100 ${
                sub.status !== "GRADED" ? "ring-yellow-400/20" : ""
              }`}
            >
              <div className="bg-slate-50/30 border-b border-slate-50 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-white to-slate-50 border border-slate-100 flex items-center justify-center text-primary shadow-inner">
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
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="bg-white text-primary border-primary/20 font-black text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-full shadow-sm"
                  >
                    O'zi bahosi: {sub.selfScore}%
                  </Badge>
                  {sub.status === "GRADED" ? (
                    <Badge className="bg-green-500 text-white border-none font-black text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-full shadow-sm shadow-green-500/20">
                      Baholangan
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-400 text-white border-none font-black text-[10px] uppercase tracking-widest py-1.5 px-4 rounded-full shadow-sm shadow-yellow-400/20 animate-pulse">
                      Kutilmoqda
                    </Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[1, 2, 3, 4].map((n) => {
                    const question = (reflection as any)[`question${n}`];
                    const answer = (sub as any)[`answer${n}`];
                    if (!question) return null;

                    return (
                      <div
                        key={n}
                        className="group space-y-3 p-5 rounded-3xl bg-slate-50/50 border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
                      >
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                          <span className="h-5 w-5 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                            {n}
                          </span>
                          {question}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed font-bold pl-1">
                          {answer || "Javob qoldirilmagan"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-8 border-t border-slate-50 flex flex-wrap items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      O'qituvchi Bahosi (0-100):
                    </Label>
                    {sub.status === "GRADED" && editingId !== sub.id ? (
                      <div className="flex items-center gap-4">
                        <span className="text-4xl font-black text-primary tracking-tighter">
                          {sub.teacherScore}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 px-4 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest transition-all"
                          onClick={() => setEditingId(sub.id!)}
                        >
                          Tahrirlash
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            className="h-14 w-32 rounded-2xl border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 font-black text-2xl text-center shadow-inner transition-all"
                            defaultValue={sub.teacherScore || 0}
                            id={`score-${sub.id}`}
                            autoFocus
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">
                            %
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-2xl h-14 px-10 bg-black hover:bg-slate-800 text-white font-black text-sm gap-2 shadow-2xl shadow-black/20 transition-all active:scale-95 flex items-center justify-center min-w-[140px]"
                          disabled={gradeMutation.isPending}
                          onClick={() => {
                            const inp = document.getElementById(
                              `score-${sub.id}`,
                            ) as HTMLInputElement;
                            if (inp) {
                              const score = parseInt(inp.value);
                              if (isNaN(score) || score < 0 || score > 100) {
                                toast.error(
                                  "Baho 0 va 100 orasida bo'lishi kerak",
                                );
                                return;
                              }
                              gradeMutation.mutate({
                                submissionId: sub.id!,
                                score,
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
                            className="h-14 rounded-2xl px-6 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-900"
                            onClick={() => setEditingId(null)}
                          >
                            Bekor qilish
                          </Button>
                        )}
                      </div>
                    )}
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

export default ReflectionGrader;
