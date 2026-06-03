import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLessonQuiz,
  createLessonQuiz,
  updateQuiz,
  deleteQuiz,
  QuizDto,
} from "@/lib/quiz-api";

/** Local draft type used by the editor */
interface QuestionDraft {
  text: string;
  points: number;
  options: string[];
  correctOptionIndex: number;
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Save, CheckCircle2, Shuffle } from "lucide-react";
import { toast } from "sonner";

interface QuizEditorProps {
  lessonId: number;
}

const QuizEditor: React.FC<QuizEditorProps> = ({ lessonId }) => {
  const queryClient = useQueryClient();
  const { data: quiz, isLoading } = useQuery({
    queryKey: ["lesson-quiz", lessonId],
    queryFn: () => getLessonQuiz(lessonId).catch(() => null),
  });

  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [title, setTitle] = useState("Dars testi");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);

  useEffect(() => {
    if (quiz && Array.isArray(quiz.questions)) {
      const mappedQuestions: QuestionDraft[] = quiz.questions.map((q) => ({
        text: q.text || "",
        points: q.points || 1,
        options: Array.isArray(q.options)
          ? q.options.map((o) => o.text || "")
          : ["", "", "", ""],
        correctOptionIndex: Array.isArray(q.options)
          ? Math.max(0, q.options.findIndex((o) => o.isCorrect))
          : 0,
      }));
      setQuestions(mappedQuestions);
      setTitle(quiz.title || "Dars testi");
      setShuffleQuestions(quiz.shuffleQuestions || false);
    }
  }, [quiz]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<QuizDto>) =>
      quiz?.id ? updateQuiz(quiz.id, data) : createLessonQuiz(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-quiz", lessonId] });
      toast.success("Test saqlandi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuiz(quiz!.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-quiz", lessonId] });
      setQuestions([]);
      setTitle("Dars testi");
      setShuffleQuestions(false);
      toast.success("Test o'chirildi");
    },
  });

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", points: 1, options: ["", "", "", ""], correctOptionIndex: 0 },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSave = () => {
    if (questions.length === 0)
      return toast.error("Kamida bitta savol qo'shing");
    if (questions.some((q) => !q.text || q.options.some((o) => !o))) {
      return toast.error("Barcha maydonlarni to'ldiring");
    }
    const apiQuestions = questions.map((q) => ({
      text: q.text,
      points: q.points,
      options: q.options.map((opt, i) => ({
        text: opt,
        isCorrect: i === q.correctOptionIndex,
      })),
    }));
    saveMutation.mutate({ title, shuffleQuestions, questions: apiQuestions, lessonId });
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Yuklanmoqda...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1 flex-1">
          <Label>Test Sarlavhasi</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold"
          />
        </div>
        <div className="flex items-center gap-3">
          {quiz?.id && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Testni o'chirishni xohlaysizmi?"))
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

      {/* Shuffle toggle */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Shuffle className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="shuffle" className="flex-1 cursor-pointer text-sm">
          Savollarni aralashtirish
        </Label>
        <Switch
          id="shuffle"
          checked={shuffleQuestions}
          onCheckedChange={setShuffleQuestions}
        />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <Card key={qIndex}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-md">Savol {qIndex + 1}</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground">Ball:</Label>
                  <Input
                    type="number"
                    min={1}
                    value={q.points}
                    onChange={(e) =>
                      updateQuestion(qIndex, { points: parseInt(e.target.value) || 1 })
                    }
                    className="h-7 w-16 text-center text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(qIndex)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Savol matni</Label>
                <Input
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, { text: e.target.value })
                  }
                  placeholder="Savolni kiriting..."
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <Button
                      variant={
                        q.correctOptionIndex === oIndex ? "default" : "outline"
                      }
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() =>
                        updateQuestion(qIndex, { correctOptionIndex: oIndex })
                      }
                      title={q.correctOptionIndex === oIndex ? "To'g'ri javob" : "To'g'ri deb belgilash"}
                    >
                      {q.correctOptionIndex === oIndex ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{oIndex + 1}</span>
                      )}
                    </Button>
                    <Input
                      value={opt}
                      onChange={(e) =>
                        updateOption(qIndex, oIndex, e.target.value)
                      }
                      placeholder={`Variant ${oIndex + 1}`}
                      className="h-9"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={addQuestion}
      >
        <Plus className="h-4 w-4 mr-2" />
        Yangi savol qo'shish
      </Button>
    </div>
  );
};

export default QuizEditor;
