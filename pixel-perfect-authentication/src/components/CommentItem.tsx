import React, { useState } from "react";
import { StudentReviewDto } from "@/lib/student-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Reply, Send, User as UserIcon, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { replyToComment } from "@/lib/student-api";
import { toast } from "sonner";

interface CommentItemProps {
  comment: StudentReviewDto;
  onSuccess: () => void;
  level?: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onSuccess,
  level = 0,
}) => {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const replyMutation = useMutation({
    mutationFn: (text: string) => replyToComment(comment.id, text),
    onSuccess: () => {
      setReplyText("");
      setIsReplyOpen(false);
      onSuccess();
      toast.success("Javob yuborildi!");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const handleReply = () => {
    if (!replyText.trim()) return;
    replyMutation.mutate(replyText);
  };

  return (
    <div className={cn("group", level > 0 && "ml-8 mt-4")}>
      <div
        className={cn(
          "flex gap-4 p-5 rounded-3xl border transition-all duration-300",
          "bg-slate-800/20 hover:bg-slate-800/40 border-slate-700/20 hover:border-slate-700/50",
          level > 0 && "bg-slate-900/40 border-slate-800/50",
        )}
      >
        <Avatar className="h-10 w-10 shrink-0 rounded-xl border-2 border-primary/20 bg-primary/10">
          <AvatarFallback className="bg-transparent text-primary font-bold">
            {comment.userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm text-white">
                {comment.userName}
              </span>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed">
            {comment.text}
          </p>

          <div className="pt-2 flex items-center gap-4">
            <button
              className="text-primary text-xs font-bold flex items-center gap-1.5 hover:underline transition-all"
              onClick={() => setIsReplyOpen(!isReplyOpen)}
            >
              <Reply
                className={cn(
                  "h-3.5 w-3.5",
                  isReplyOpen && "rotate-180 transition-transform",
                )}
              />
              {isReplyOpen ? "Bekor qilish" : "Javob berish"}
            </button>

            {comment.replies && comment.replies.length > 0 && (
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {comment.replies.length} ta javob
              </span>
            )}
          </div>

          {/* Reply Input */}
          {isReplyOpen && (
            <div className="mt-4 space-y-3 pl-4 border-l-2 border-primary/30 py-2 animate-in slide-in-from-left-2 duration-300">
              <Textarea
                placeholder="Javobingizni yozing..."
                className="bg-slate-900/80 border-slate-700 text-sm min-h-[80px] rounded-2xl focus:ring-primary/50"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl h-9"
                  onClick={() => setIsReplyOpen(false)}
                >
                  Bekor qilish
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl h-9 px-4 font-bold gap-2"
                  onClick={handleReply}
                  disabled={replyMutation.isPending || !replyText.trim()}
                >
                  {replyMutation.isPending ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Yuborish
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recursive Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l border-slate-800 ml-5">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onSuccess={onSuccess}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
