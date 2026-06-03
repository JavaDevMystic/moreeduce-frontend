import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCourseStats,
  getStudentStats,
  compareCoursesStats,
} from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  Search,
  Loader2,
  GitCompare,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  LineChart,
  Line,
} from "recharts";

const AdminStatistics = () => {
  const [courseId, setCourseId] = useState("");
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [studentId, setStudentId] = useState("");
  const [activeStudentId, setActiveStudentId] = useState<number | null>(null);
  const [cmp1, setCmp1] = useState("");
  const [cmp2, setCmp2] = useState("");
  const [activeCmp, setActiveCmp] = useState<{ c1: number; c2: number } | null>(null);

  const { data: courseStats, isLoading: loadingCourse, error: courseError } = useQuery({
    queryKey: ["course-stats", activeCourseId],
    queryFn: () => getCourseStats(activeCourseId!),
    enabled: activeCourseId !== null,
  });

  const { data: studentStats, isLoading: loadingStudent, error: studentError } = useQuery({
    queryKey: ["student-stats", activeStudentId],
    queryFn: () => getStudentStats(activeStudentId!),
    enabled: activeStudentId !== null,
  });

  const { data: compareData, isLoading: loadingCompare, error: compareError } = useQuery({
    queryKey: ["compare-courses", activeCmp],
    queryFn: () => compareCoursesStats(activeCmp!.c1, activeCmp!.c2),
    enabled: activeCmp !== null,
  });

  // Prepare chart data
  const courseChartData = courseStats
    ? [
        { name: "O'rtacha", value: courseStats.meanScore ?? 0, fill: "hsl(var(--primary))" },
        { name: "Min", value: courseStats.minScore ?? 0, fill: "hsl(0 84% 60%)" },
        { name: "Max", value: courseStats.maxScore ?? 0, fill: "hsl(142 71% 45%)" },
        { name: "Std Dev", value: courseStats.standardDeviation ?? 0, fill: "hsl(38 92% 50%)" },
      ]
    : [];

  const radarData =
    studentStats?.moduleResults?.map((m) => ({
      module: m.moduleTitle,
      quiz: m.quizScore ?? 0,
      reflection: m.reflectionScore ?? 0,
    })) ?? [];

  const progressData = studentStats?.progressHistory
    ? Object.entries(studentStats.progressHistory).map(([date, score]) => ({
        date,
        score,
      }))
    : [];

  const compareChartData = compareData
    ? Object.entries(compareData).map(([key, val]) => ({
        name: key,
        value: typeof val === "number" ? parseFloat(val.toFixed(4)) : 0,
      }))
    : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Statistika</h1>
      </div>

      {/* ── Course Statistics ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Kurs Statistikasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Kurs ID kiriting..."
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && courseId && setActiveCourseId(Number(courseId))}
              className="max-w-xs"
            />
            <Button onClick={() => courseId && setActiveCourseId(Number(courseId))} disabled={!courseId} className="gap-2">
              <Search className="h-4 w-4" /> Ko'rish
            </Button>
          </div>

          {loadingCourse && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
            </div>
          )}
          {courseError && <p className="text-sm text-destructive">Kurs topilmadi yoki xatolik yuz berdi.</p>}

          {courseStats && typeof courseStats === "object" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatMini label="Talabalar" value={courseStats.totalStudents ?? 0} />
                <StatMini label="O'rtacha" value={`${courseStats.meanScore?.toFixed(1) ?? 0}%`} />
                <StatMini label="Std Dev" value={courseStats.standardDeviation?.toFixed(2) ?? "0"} />
                <StatMini label="Min" value={`${courseStats.minScore?.toFixed(1) ?? 0}%`} />
                <StatMini label="Max" value={`${courseStats.maxScore?.toFixed(1) ?? 0}%`} />
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseChartData} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Student Statistics ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Talaba Rivojlanishi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Talaba ID kiriting..."
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && studentId && setActiveStudentId(Number(studentId))}
              className="max-w-xs"
            />
            <Button onClick={() => studentId && setActiveStudentId(Number(studentId))} disabled={!studentId} className="gap-2">
              <Search className="h-4 w-4" /> Ko'rish
            </Button>
          </div>

          {loadingStudent && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Yuklanmoqda...
            </div>
          )}
          {studentError && <p className="text-sm text-destructive">Talaba topilmadi yoki xatolik.</p>}

          {studentStats && typeof studentStats === "object" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatMini label="Talaba" value={studentStats.studentName || "–"} sub={`ID: ${studentStats.studentId || "–"}`} />
                <StatMini label="O'rtacha ball" value={`${typeof studentStats.averageScore === "number" ? studentStats.averageScore.toFixed(1) : "0"}%`} />
                <StatMini label="Faoliyat soni" value={studentStats.totalActivityCount ?? 0} />
                <StatMini
                  label="So'ngi faol"
                  value={
                    studentStats.lastActiveAt
                      ? new Date(studentStats.lastActiveAt).toLocaleDateString("uz-UZ")
                      : "–"
                  }
                />
              </div>

              {/* Radar Chart for module results */}
              {radarData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Modul bo'yicha natijalar</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid className="stroke-border" />
                        <PolarAngleAxis dataKey="module" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                        <Radar name="Test" dataKey="quiz" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Radar name="Refleksiya" dataKey="reflection" stroke="hsl(38 92% 50%)" fill="hsl(38 92% 50%)" fillOpacity={0.3} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Progress line chart */}
              {progressData.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Taraqqiyot tarixi</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Module results table */}
              {studentStats.moduleResults && studentStats.moduleResults.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="p-3 text-left font-medium">Modul</th>
                        <th className="p-3 text-center font-medium">Test bali</th>
                        <th className="p-3 text-center font-medium">Refleksiya bali</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.moduleResults.map((m, idx) => (
                        <tr key={idx} className="border-t hover:bg-muted/20">
                          <td className="p-3 font-medium">{m.moduleTitle}</td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary">{m.quizScore?.toFixed(1) ?? "–"}%</Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline">{m.reflectionScore?.toFixed(1) ?? "–"}%</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Compare Courses (T-Test) ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            Kurslarni Solishtirish (T-Test)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Input type="number" placeholder="1-kurs ID" value={cmp1} onChange={(e) => setCmp1(e.target.value)} className="w-36" />
            <span className="text-muted-foreground font-medium">vs</span>
            <Input type="number" placeholder="2-kurs ID" value={cmp2} onChange={(e) => setCmp2(e.target.value)} className="w-36" />
            <Button
              onClick={() => cmp1 && cmp2 && setActiveCmp({ c1: Number(cmp1), c2: Number(cmp2) })}
              disabled={!cmp1 || !cmp2}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" /> Solishtirish
            </Button>
          </div>

          {loadingCompare && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Hisoblanmoqda...
            </div>
          )}
          {compareError && <p className="text-sm text-destructive">Kurslarni solishtirishda xatolik.</p>}

          {compareData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(compareData).map(([key, val]) => (
                  <StatMini key={key} label={key} value={typeof val === "number" ? val.toFixed(4) : String(val)} />
                ))}
              </div>
              {compareChartData.length > 0 && (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={compareChartData} barSize={40}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatMini = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-muted/30 rounded-lg p-3 border">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-bold mt-0.5">{value}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

export default AdminStatistics;
