import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessonQuiz,
  submitQuiz,
  getMyQuizResults,
  QuizDto,
  QuizResultDto,
} from "@/lib/quiz-api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Loader2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizTakerProps {
  lessonId: number;
  onComplete?: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ lessonId, onComplete }) => {
  const queryClient = useQueryClient();
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResultDto | null>(null);

  const {
    data: quiz,
    isLoading: isQuizLoading,
    error,
  } = useQuery({
    queryKey: ["lesson-quiz-student", lessonId],
    queryFn: () => getLessonQuiz(lessonId).catch(() => null),
  });

  const { data: myResults, isLoading: isResultsLoading } = useQuery({
    queryKey: ["student-quiz-results-all"],
    queryFn: () => getMyQuizResults().catch(() => []),
    enabled: !!quiz,
  });

  // Find result for this specific quiz
  React.useEffect(() => {
    if (myResults && quiz?.id) {
      const existing = myResults.find((r) => r.quizId === quiz.id);
      if (existing) {
        setResult(existing);
      }
    }
  }, [myResults, quiz]);

  const isLoading = isQuizLoading || (quiz && isResultsLoading);

  // Call onComplete if quiz is already passed or if result is set
  React.useEffect(() => {
    if (!isLoading && (!quiz || !quiz.questions?.length)) {
      onComplete?.();
    }
    if (result && (result.scorePercentage ?? 0) >= 70) {
      onComplete?.();
    }
  }, [result, onComplete, quiz, isLoading]);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!quiz?.id) throw new Error("Quiz not found");
      const answerList = Object.entries(answers).map(
        ([questionId, selectedOptionId]) => ({
          questionId: parseInt(questionId),
          selectedOptionId,
        }),
      );
      return submitQuiz(quiz.id, { answers: answerList });
    },
    onSuccess: (data) => {
      setResult(data);
      // Invalidate both general and specific results queries
      queryClient.invalidateQueries({ queryKey: ["student-quiz-results-all"] });
      queryClient.invalidateQueries({
        queryKey: ["student-quiz-result", lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-course-details"],
      });
      toast.success("Test muvaffaqiyatli topshirildi!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Test topshirishda xatolik yuz berdi");
    },
  });

  if (isLoading) return null;
  if (!quiz || !quiz.questions?.length) return null;

  // Result screen
  if (result) {
    const percentage = result.scorePercentage ?? 0;
    const passed = percentage >= 70;
    return (
      <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-xl font-black text-white">Test Natijalari</h3>
        </div>
        <Card className="bg-slate-800/50 border-slate-700/50 overflow-hidden">
          <CardContent className="p-0">
            {/* Summary Header */}
            <div className="p-8 text-center space-y-6 border-b border-slate-700/30 bg-slate-800/20">
              <div
                className={cn(
                  "h-20 w-20 rounded-full flex items-center justify-center mx-auto",
                  passed ? "bg-green-500/20" : "bg-red-500/20",
                )}
              >
                {passed ? (
                  <Trophy className="h-10 w-10 text-green-400" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {passed ? "Tabriklaymiz! 🎉" : "Qayta urinib ko'ring"}
                </h3>
                <p className="text-slate-400 text-sm">
                  {result.earnedPoints}/{result.totalPossiblePoints} ball
                  to'pladingiz
                </p>
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                <Progress value={percentage} className="h-3" />
                <p
                  className={cn(
                    "text-2xl font-extrabold",
                    passed ? "text-green-400" : "text-red-400",
                  )}
                >
                  {percentage.toFixed(0)}%
                </p>
              </div>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setStarted(false);
                }}
              >
                Qaytadan topshirish
              </Button>
            </div>

            {/* Detailed Breakdown */}
            <div className="p-6 space-y-8">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">
                  Javoblar tafsiloti
                </h4>
                {!quiz.questions.some((q) =>
                  q.options.some((o) => o.isCorrect),
                ) && (
                  <span className="text-[10px] font-bold text-orange-400/80 bg-orange-400/10 px-2 py-1 rounded-lg">
                    To'g'ri javoblar berkitilgan
                  </span>
                )}
              </div>

              {quiz.questions.map((question, qIdx) => {
                const selectedId = answers[question.id!];
                // Check if we even have correctness info - use Boolean() to handle string "true"/"false"
                const hasCorrectnessInfo = question.options.some(
                  (o) => Boolean(o.isCorrect) === true,
                );
                const correctOption = question.options.find((o) => Boolean(o.isCorrect));
                // Compare with loose equality to handle string/number type mismatch
                const isCorrect = hasCorrectnessInfo
                  ? String(selectedId) === String(correctOption?.id)
                  : null;

                return (
                  <div
                    key={question.id}
                    className="space-y-4 p-4 rounded-3xl bg-slate-900/40 border border-white/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-white font-bold leading-relaxed">
                        <span className="text-primary mr-2">{qIdx + 1}.</span>
                        {question.text}
                      </p>
                      {hasCorrectnessInfo ? (
                        isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-1" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-1" />
                        )
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mt-1">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2">
                      {question.options.map((option) => {
                        const isSelected = String(selectedId) === String(option.id);
                        const isThisCorrect = Boolean(option.isCorrect);

                        let state:
                          | "correct"
                          | "wrong"
                          | "neutral"
                          | "submitted" = "neutral";

                        if (hasCorrectnessInfo) {
                          if (isThisCorrect) state = "correct";
                          else if (isSelected) state = "wrong";
                        } else if (isSelected) {
                          state = "submitted";
                        }

                        return (
                          <div
                            key={option.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-2xl border text-sm transition-all relative overflow-hidden",
                              state === "correct" &&
                                "bg-green-500/10 border-green-500/30 text-green-400 font-bold",
                              state === "wrong" &&
                                "bg-red-500/10 border-red-500/30 text-red-400 font-medium",
                              state === "submitted" &&
                                "bg-primary/10 border-primary/30 text-primary font-bold",
                              state === "neutral" &&
                                "bg-slate-800/10 border-slate-700/30 text-slate-400 opacity-60",
                            )}
                          >
                            <div
                              className={cn(
                                "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                state === "correct" &&
                                  "border-green-400 bg-green-400 text-slate-900",
                                state === "wrong" &&
                                  "border-red-400 bg-red-400 text-slate-900",
                                state === "submitted" &&
                                  "border-primary bg-primary text-white",
                                state === "neutral" && "border-slate-700",
                              )}
                            >
                              {state === "correct" && (
                                <CheckCircle2
                                  className="h-3 w-3"
                                  strokeWidth={4}
                                />
                              )}
                              {state === "wrong" && (
                                <XCircle className="h-3 w-3" strokeWidth={4} />
                              )}
                              {state === "submitted" && (
                                <CheckCircle2
                                  className="h-3 w-3"
                                  strokeWidth={4}
                                />
                              )}
                            </div>
                            <span className="flex-1">{option.text}</span>
                            {isSelected && (
                              <span className="text-[10px] font-black uppercase tracking-tighter">
                                Sizning javobingiz
                              </span>
                            )}
                            {hasCorrectnessInfo &&
                              option.isCorrect &&
                              !isSelected && (
                                <span className="text-[10px] font-black uppercase tracking-tighter">
                                  To'g'ri javob
                                </span>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Start screen
  if (!started) {
    const totalPoints = quiz.questions.reduce((s, q) => s + (q.points || 1), 0);
    return (
      <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-xl font-black text-white">Dars Testi</h3>
        </div>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BrainCircuit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white">{quiz.title}</h3>
                <p className="text-slate-400 text-sm">
                  {quiz.questions.length} savol · {totalPoints} ball
                </p>
              </div>
            </div>
            <Button onClick={() => setStarted(true)} className="gap-2">
              <BrainCircuit className="h-4 w-4" />
              Testni boshlash
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz questions
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === quiz.questions.length;

  return (
    <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <BrainCircuit className="h-5 w-5 text-orange-500" />
        </div>
        <h3 className="text-xl font-black text-white">Dars Testi</h3>
      </div>
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              {quiz.title}
            </CardTitle>
            <span className="text-sm text-slate-400">
              {answeredCount}/{quiz.questions.length} javob
            </span>
          </div>
          <Progress
            value={(answeredCount / quiz.questions.length) * 100}
            className="h-1.5 mt-3"
          />
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {quiz.questions.map((question, qIdx) => (
            <div key={question.id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-white font-medium">
                  <span className="text-primary font-bold mr-2">
                    {qIdx + 1}.
                  </span>
                  {question.text}
                </p>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {question.points} ball
                </span>
              </div>
              <RadioGroup
                value={answers[question.id!]?.toString()}
                onValueChange={(val) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [question.id!]: parseInt(val),
                  }))
                }
                className="space-y-2"
              >
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      answers[question.id!] === option.id
                        ? "border-primary bg-primary/10"
                        : "border-slate-700/50 hover:border-slate-600 bg-slate-800/30",
                    )}
                  >
                    <RadioGroupItem value={option.id!.toString()} />
                    <span className="text-sm text-slate-200">
                      {option.text}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-700/50">
            <Button
              className="w-full h-12 text-base font-bold gap-2"
              disabled={!allAnswered || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              Testni topshirish
            </Button>
            {!allAnswered && (
              <p className="text-center text-xs text-slate-500 mt-2">
                Barcha savollarga javob bering
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizTaker;
