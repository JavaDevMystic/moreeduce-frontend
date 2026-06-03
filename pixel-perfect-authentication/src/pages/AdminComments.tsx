import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminComments, deleteComment } from "@/lib/admin-api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, MessageSquare, Reply } from "lucide-react";

const AdminComments = () => {
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: getAdminComments,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Izoh o'chirildi");
    },
    onError: (err: any) => toast.error(err.message || "O'chirishda xatolik"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Izohlar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {Array.isArray(comments) ? comments.length : 0} ta izoh
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Foydalanuvchi</TableHead>
              <TableHead>Izoh matni</TableHead>
              <TableHead>Dars ID</TableHead>
              <TableHead>Javoblar</TableHead>
              <TableHead>Sana</TableHead>
              <TableHead className="text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    Yuklanmoqda...
                  </div>
                </TableCell>
              </TableRow>
            ) : !Array.isArray(comments) ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-destructive"
                >
                  Yuklashda xatolik yuz berdi
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Izohlar topilmadi
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{comment.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        ID: {comment.userId}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm line-clamp-2 leading-relaxed">
                      {comment.text}
                    </p>
                    {comment.parentCommentId && (
                      <div className="flex items-center gap-1 mt-1">
                        <Reply className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Javob ({comment.parentCommentId})
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      Dars {comment.lessonId}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {comment.replies && comment.replies.length > 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {comment.replies.length} ta
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">–</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString("uz-UZ")
                      : "–"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Izohni o'chirishni tasdiqlaysizmi?"))
                          deleteMutation.mutate(comment.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminComments;
