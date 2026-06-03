import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitAssignment,
  getAssignmentResult,
  getLessonAssignment,
} from "@/lib/student-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AssignmentTakerProps {
  lessonId: number;
  onComplete?: () => void;
}

const AssignmentTaker: React.FC<AssignmentTakerProps> = ({
  lessonId,
  onComplete,
}) => {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: assignment, isLoading: isAssLoading } = useQuery({
    queryKey: ["student-lesson-assignment", lessonId],
    queryFn: () => getLessonAssignment(lessonId).catch(() => null),
  });

  const assignmentId = assignment?.id;

  const { data: myResult, isLoading: isResultLoading } = useQuery({
    queryKey: ["student-assignment-result", assignmentId],
    queryFn: () => getAssignmentResult(assignmentId!).catch(() => null),
    enabled: !!assignmentId,
  });

  React.useEffect(() => {
    if (!isAssLoading && !assignment) {
      onComplete?.();
    }
    if (myResult) {
      onComplete?.();
    }
  }, [myResult, onComplete, assignment, isAssLoading]);

  const submitMutation = useMutation({
    mutationFn: (text: string) => submitAssignment(assignmentId!, text),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-assignment-result", assignmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["student-course-details"],
      });
      toast.success("Topshiriq yuborildi!");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  if (isAssLoading || (assignmentId && isResultLoading))
    return (
      <div className="py-8 text-center text-slate-500">Yuklanmoqda...</div>
    );

  if (!assignment) return null;

  if (myResult) {
    return (
      <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-xl font-black text-white">Amaliy Vazifa</h3>
        </div>
        <Card className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden">
          <CardHeader className="bg-emerald-500/10 border-b border-emerald-500/10 py-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-xl text-white">
                  Topshiriq topshirilgan
                </CardTitle>
                <CardDescription className="text-emerald-500/70">
                  O'qituvchi baholashini kuting.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <p className="text-slate-200 whitespace-pre-wrap">
                {myResult.submissionContent}
              </p>
            </div>

            {myResult.grade !== null && (
              <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-primary uppercase">
                    Natija
                  </span>
                  <span className="text-2xl font-black text-white">
                    {myResult.grade} / 100
                  </span>
                </div>
                {myResult.teacherFeedback && (
                  <div className="pt-4 border-t border-primary/10">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                      O'qituvchi fikri:
                    </p>
                    <p className="text-slate-300 italic">
                      "{myResult.teacherFeedback}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-orange-500" />
        </div>
        <h3 className="text-xl font-black text-white">Amaliy Vazifa</h3>
      </div>
      <Card className="bg-white/5 border-white/10 rounded-[32px] overflow-hidden">
        <CardHeader className="bg-primary/10 border-b border-primary/10 py-8 px-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <FileText className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-white">
                {assignment.title}
              </CardTitle>
              <CardDescription className="text-slate-400">
                {assignment.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <Textarea
            placeholder="Javobingizni shu yerga yozing..."
            className="min-h-[200px] bg-white/[0.03] border-white/10 rounded-2xl p-6 text-white text-base focus:ring-primary"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button
            className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[20px] font-black text-lg gap-3"
            onClick={() => submitMutation.mutate(content)}
            disabled={submitMutation.isPending || !content}
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

export default AssignmentTaker;
