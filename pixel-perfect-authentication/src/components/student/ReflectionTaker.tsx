import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessonReflection,
  submitReflection,
  getMyReflectionResult,
  ReflectionSubmissionDto,
} from "@/lib/student-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { CheckCircle2, AlertCircle, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReflectionTakerProps {
  lessonId: number;
  onComplete?: () => void;
}

const ReflectionTaker: React.FC<ReflectionTakerProps> = ({
  lessonId,
  onComplete,
}) => {
  const queryClient = useQueryClient();

  const {
    data: reflection,
    isLoading: isRefLoading,
    isError: isRefError,
  } = useQuery({
    queryKey: ["student-lesson-reflection", lessonId],
    queryFn: () => getLessonReflection(lessonId),
    retry: false, // Don't retry if it's 404
  });

  const { data: myResult, isLoading: isResultLoading } = useQuery({
    queryKey: ["student-reflection-result", lessonId],
    queryFn: () => getMyReflectionResult(lessonId).catch(() => null),
  });

  const activeReflection = reflection;

  useEffect(() => {
    // If we have a result, we're done
    if (myResult) {
      onComplete?.();
    }
  }, [myResult, onComplete]);

  const [answers, setAnswers] = useState({
    answer1: "",
    answer2: "",
    answer3: "",
    answer4: "",
    selfScore: 50,
    reflectionIndex: 0,
  });

  const submitMutation = useMutation({
    mutationFn: (data: ReflectionSubmissionDto) => {
      // If it's a default reflection, we might not have a reflection.id on the server
      // But the API might expect one. If reflection is null, we use a placeholder or check if API supports lesson-based submit.
      // Looking at student-api.ts: submitReflection = (reflectionId: number, submission: StudentReflectionSubmissionDto)
      // We'll use reflection.id if available, otherwise we might need a backup or the API might need to handle it.
      // For now, let's assume we use reflection.id or 0 for default (if server supports)
      return submitReflection(activeReflection?.id || 0, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-reflection-result", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-course-details"],
      });
      toast.success("Refleksiya muvaffaqiyatli topshirildi!");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  if (!isRefLoading && !reflection && !myResult) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleScoreChange = (val: number) => {
    setAnswers((prev) => ({ ...prev, selfScore: val }));
  };

  const handleSubmit = () => {
    if (activeReflection.id === 0) {
      return toast.error(
        "Ushbu dars uchun refleksiya hali o'qituvchi tomonidan yaratilmagan. Iltimos, keyinroq urinib ko'ring.",
      );
    }
    if (
      !answers.answer1 ||
      !answers.answer2 ||
      !answers.answer3 ||
      !answers.answer4
    ) {
      return toast.error("Iltimos, barcha savollarga javob bering");
    }
    submitMutation.mutate(answers);
  };

  if (isRefLoading || isResultLoading)
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">
          Yuklanmoqda...
        </p>
      </div>
    );

  const displayReflection = activeReflection;

  // If we have a result, show it immediately
  if (myResult) {
    return (
      <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-xl font-black text-white">Dars Refleksiyasi</h3>
        </div>
        <Card className="bg-white/5 border-white/10 overflow-hidden backdrop-blur-md rounded-[32px]">
          <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/10 py-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">
                  Refleksiya topshirilgan
                </CardTitle>
                <CardDescription className="text-emerald-500/70">
                  Sizning javobingiz qabul qilingan va tahlil qilingan.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-6">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
                >
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {displayReflection
                      ? (displayReflection as any)[`question${num}`]
                      : `Savol ${num}`}
                  </p>
                  <p className="text-slate-200">
                    {(myResult as any)[`answer${num}`]}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase tracking-tighter mb-1">
                  Self-Score
                </p>
                <p className="text-2xl font-black text-white">
                  {myResult.selfScore}%
                </p>
              </div>
              {myResult.aiScore !== undefined && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter mb-1">
                    AI Bahosi
                  </p>
                  <p className="text-2xl font-black text-white">
                    {myResult.aiScore}%
                  </p>
                </div>
              )}
              {myResult.teacherScore !== undefined && (
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mb-1">
                    O'qituvchi Bahosi
                  </p>
                  <p className="text-2xl font-black text-white">
                    {myResult.teacherScore}%
                  </p>
                </div>
              )}
            </div>

            {myResult.aiFeedback && (
              <div className="mt-4 p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-black text-blue-400 uppercase tracking-widest">
                    AI Mulohazasi
                  </span>
                </div>
                <p className="text-slate-300 text-sm italic leading-relaxed">
                  "{myResult.aiFeedback}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no reflection template found and no previous result, don't show anything
  if (!displayReflection) return null;

  return (
    <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-xl font-black text-white">Dars Refleksiyasi</h3>
      </div>
      <Card className="bg-white/5 border-white/10 overflow-hidden backdrop-blur-md rounded-[32px] shadow-2xl">
        <CardHeader className="bg-primary/10 border-b border-primary/10 py-8 px-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-white">
                {displayReflection.title}
              </CardTitle>
              <CardDescription className="text-slate-400 mt-1">
                Dars bo'yicha o'z fikrlaringizni va o'zlashtirish darajangizni
                baholang.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid gap-8">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="space-y-4">
                <Label className="text-sm font-bold text-slate-200 block">
                  {num}. {(displayReflection as any)[`question${num}`]}
                </Label>
                <Input
                  name={`answer${num}`}
                  value={(answers as any)[`answer${num}`]}
                  onChange={handleInputChange}
                  className="bg-white/[0.03] border-white/10 h-14 rounded-2xl focus:ring-primary focus:border-primary px-6 text-white text-base transition-all hover:bg-white/[0.05]"
                  placeholder="Fikringizni shu yerga yozing..."
                />
              </div>
            ))}
          </div>

          <div className="space-y-6 pt-6 border-t border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold text-slate-200">
                Mavzuni o'zlashtirish darajangiz (0-100%)
              </Label>
              <span className="text-2xl font-black text-primary">
                {answers.selfScore}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={answers.selfScore}
              onChange={(e) => handleScoreChange(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">
              <span>Boshlang'ich</span>
              <span>O'rtacha</span>
              <span>Mukammal</span>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[20px] font-black text-lg gap-3 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {submitMutation.isPending ? (
              "Yuborilmoqda..."
            ) : (
              <>
                Topshirish <Send className="h-5 w-5" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReflectionTaker;
