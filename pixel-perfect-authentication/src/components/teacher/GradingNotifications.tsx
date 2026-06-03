import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardPendingSubmissions,
  getDashboardPendingEnrollments,
} from "@/lib/teacher-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  MessageCircle,
  User,
  Sparkles,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
  id: string | number;
  type: "submission" | "enrollment" | "message";
  title: string;
  description: string;
  time: string;
  studentName?: string;
  lessonId?: number;
  lessonTitle?: string;
  courseId?: number;
  courseName?: string;
  reflectionId?: number;
}

const GradingNotifications = ({
  onSelectLesson,
}: {
  onSelectLesson: (lesson: {
    id: number;
    title: string;
    type: "reflection" | "assignment";
  }) => void;
}) => {
  const { data: submissions = [], isLoading: isSubLoading } = useQuery({
    queryKey: ["pending-submissions"],
    queryFn: getDashboardPendingSubmissions,
  });

  const { data: enrollments = [], isLoading: isEnrLoading } = useQuery({
    queryKey: ["pending-enrollments"],
    queryFn: getDashboardPendingEnrollments,
  });

  const isLoading = isSubLoading || isEnrLoading;

  const notifications: Notification[] = [];

  // Submissions
  if (Array.isArray(submissions)) {
    submissions.forEach((s: any) => {
      notifications.push({
        id: `sub-${s.id}`,
        type: "submission",
        title: s.reflectionId ? "Yangi Refleksiya" : "Yangi Topshiriq",
        description: `${s.studentName || "Talaba"} '${s.lessonTitle || "Dars"}' darsiga o'z ishini topshirdi.`,
        time: s.submittedAt
          ? new Date(s.submittedAt).toLocaleTimeString()
          : "Yaqinda",
        studentName: s.studentName,
        lessonId: s.lessonId,
        lessonTitle: s.lessonTitle,
        reflectionId: s.reflectionId,
      });
    });
  } else if (typeof submissions === "number" && submissions > 0) {
    notifications.push({
      id: "sub-count",
      type: "submission",
      title: "Yangi Topshiriqlar",
      description: `Sizda ${submissions} ta kutilayotgan topshiriq bor.`,
      time: "Hozir",
    });
  }

  // Enrollments
  if (Array.isArray(enrollments)) {
    enrollments.forEach((e: any) => {
      notifications.push({
        id: `enr-${e.enrollmentId || e.id}`,
        type: "enrollment",
        title: "Kursga a'zo bo'lish",
        description: `${e.studentName || "Talaba"} '${e.courseName || "Kurs"}' kursiga a'zo bo'lmoqchi.`,
        time: e.createdAt
          ? new Date(e.createdAt).toLocaleTimeString()
          : "Yaqinda",
        studentName: e.studentName,
      });
    });
  } else if (typeof enrollments === "number" && enrollments > 0) {
    notifications.push({
      id: "enr-count",
      type: "enrollment",
      title: "Yangi A'zoliklar",
      description: `Sizda ${enrollments} ta kutilayotgan a'zolik so'rovi bor.`,
      time: "Hozir",
    });
  }

  return (
    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl rounded-[32px] overflow-hidden sticky top-24 ring-1 ring-slate-100">
      <CardHeader className="p-6 border-b border-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <Bell className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">
              Bildirishnomalar
            </CardTitle>
          </div>
          {notifications.length > 0 && (
            <Badge className="bg-primary text-white border-none font-black text-[10px] uppercase px-2 rounded-full">
              {notifications.length} Yangi
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                Yuklanmoqda...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center px-6">
              <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-8 w-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                Hozircha yangi bildirishnomalar yo'q
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.lessonId) {
                      onSelectLesson({
                        id: notif.lessonId,
                        title: notif.lessonTitle || "Dars",
                        type: notif.reflectionId ? "reflection" : "assignment",
                      });
                    } else if (notif.type === "submission") {
                      // If it's a general count, we can navigate to the grading page
                      // In TeacherGrading, we can't easily "jump" without an ID,
                      // but we can ensure the modal doesn't open.
                      // Alternatively, we could notify the user to select a course.
                    }
                  }}
                  className={`p-5 hover:bg-slate-50/80 transition-all cursor-pointer group relative ${notif.lessonId ? "bg-primary/[0.02]" : "bg-slate-50/30"}`}
                >
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex gap-4">
                    <div
                      className={`h-11 w-11 rounded-2xl shrink-0 flex items-center justify-center shadow-sm 
                    ${
                      notif.type === "submission"
                        ? "bg-green-50 text-green-600"
                        : notif.type === "enrollment"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-orange-50 text-orange-600"
                    }`}
                    >
                      {notif.type === "submission" ? (
                        <Sparkles className="h-5 w-5" />
                      ) : notif.type === "enrollment" ? (
                        <UserPlus className="h-5 w-5" />
                      ) : (
                        <MessageCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-black text-slate-900 text-sm truncate">
                          {notif.title}
                        </p>
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                          {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {notif.description}
                      </p>
                      {notif.studentName && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center">
                            <User className="h-3 w-3 text-slate-400" />
                          </div>
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                            {notif.studentName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50/50">
          <Button
            variant="ghost"
            disabled={notifications.length === 0}
            className="w-full rounded-2xl text-xs font-black text-slate-400 hover:text-primary hover:bg-white uppercase tracking-widest h-12 transition-all shadow-sm"
          >
            Barchasini ko'rish
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GradingNotifications;
