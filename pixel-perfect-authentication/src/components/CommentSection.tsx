import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessonComments,
  addLessonComment,
  StudentReviewDto,
} from "@/lib/student-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CommentItem from "./CommentItem";

interface CommentSectionProps {
  lessonId: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const {
    data: comments,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["lesson-comments", lessonId],
    queryFn: () => getLessonComments(lessonId),
    enabled: !!lessonId,
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => addLessonComment(lessonId, text),
    onSuccess: () => {
      setCommentText("");
      queryClient.invalidateQueries({
        queryKey: ["lesson-comments", lessonId],
      });
      toast.success("Izoh qo'shildi!");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate(commentText);
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Izohlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Dars muhokamasi</h3>
          <p className="text-xs text-slate-500 font-medium">
            {comments?.length || 0} ta fikr-mulohaza
          </p>
        </div>
      </div>

      {/* Add Comment Input */}
      <div className="bg-slate-800/30 p-6 rounded-[32px] border border-slate-700/30 space-y-4 shadow-xl shadow-black/20">
        <Textarea
          placeholder="Savolingiz yoki fikringiz bormi?..."
          className="bg-slate-900/50 border-slate-700 text-white min-h-[120px] rounded-2xl focus:ring-primary/50 transition-all text-base leading-relaxed"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            className="rounded-2xl px-8 h-12 gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:translate-y-[-2px] active:translate-y-0"
            onClick={handlePostComment}
            disabled={commentMutation.isPending || !commentText.trim()}
          >
            {commentMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Izoh qoldirish
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments && comments.length > 0 ? (
          comments.map((comment: StudentReviewDto) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onSuccess={() =>
                queryClient.invalidateQueries({
                  queryKey: ["lesson-comments", lessonId],
                })
              }
            />
          ))
        ) : (
          <div className="text-center py-20 bg-slate-900/20 border-2 border-dashed border-slate-800/50 rounded-[40px] transition-all">
            <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-10 w-10 text-slate-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-300 mb-2">
              Hozircha hech qanday muhokama yo'q
            </h4>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              Birinchi bo'lib savol bering yoki fikringizni bildiring!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
