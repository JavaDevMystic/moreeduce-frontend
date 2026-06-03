import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  GraduationCap,
  BookOpen,
  Clock,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#22d3ee",
  "#f59e0b",
  "#10b981",
  "#f43f5e",
  "#a78bfa",
];

const AdminDashboard = () => {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: getAdminStats,
  });

  const cards = [
    {
      title: "Talabalar",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      title: "O'qituvchilar",
      value: stats?.totalTeachers || 0,
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "Yangi (Oy)",
      value: stats?.newUsersThisMonth || 0,
      icon: ArrowUpRight,
      color: "text-sky-600",
      bg: "bg-sky-50",
      border: "border-sky-100",
    },
    {
      title: "Barcha Kurslar",
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
    {
      title: "Kutilayotgan",
      value: stats?.pendingCourses || 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      title: "Daromad",
      value: `${(stats?.totalRevenue || 0).toLocaleString()} so'm`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
    },
    {
      title: "Yechishlar",
      value: stats?.pendingWithdrawals || 0,
      icon: BarChart2,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
  ];

  // Bar chart data: user overview
  const barData = [
    { name: "Talabalar", value: stats?.totalStudents || 0, fill: "#6366f1" },
    {
      name: "O'qituvchilar",
      value: stats?.totalTeachers || 0,
      fill: "#22d3ee",
    },
    {
      name: "Yangi (Oy)",
      value: stats?.newUsersThisMonth || 0,
      fill: "#10b981",
    },
  ];

  // Pie chart data: course status distribution
  const pieData = [
    {
      name: "Tasdiqlangan",
      value: Math.max(
        0,
        (stats?.totalCourses || 0) - (stats?.pendingCourses || 0),
      ),
    },
    { name: "Kutilayotgan", value: stats?.pendingCourses || 0 },
  ];

  // Line chart: simulated monthly trend from newUsersThisMonth
  const now = new Date();
  const months = [
    "Yan",
    "Fev",
    "Mar",
    "Apr",
    "May",
    "Iyn",
    "Iyl",
    "Avg",
    "Sen",
    "Okt",
    "Noy",
    "Dek",
  ];
  const currentMonthIdx = now.getMonth();
  const lineData = months.slice(0, currentMonthIdx + 1).map((m, i) => {
    const base = Math.max(
      0,
      (stats?.totalStudents || 0) - (stats?.newUsersThisMonth || 0),
    );
    const monthly = stats?.newUsersThisMonth || 0;
    // Simulate a growing trend
    const simValue = Math.round(
      (base / (currentMonthIdx || 1)) * (i + 1) +
        (i === currentMonthIdx
          ? monthly
          : Math.round((monthly * i) / (currentMonthIdx || 1))),
    );
    return { name: m, talabalar: Math.max(0, simValue) };
  });

  // Radial bar chart data
  const radialData = [
    {
      name: "Tasdiqlangan kurslar",
      value: stats?.totalCourses
        ? Math.round(
            ((stats.totalCourses - (stats.pendingCourses || 0)) /
              stats.totalCourses) *
              100,
          )
        : 0,
      fill: "#6366f1",
    },
    {
      name: "Yangi foydalanuvchilar",
      value: stats?.totalStudents
        ? Math.round(
            ((stats.newUsersThisMonth || 0) / stats.totalStudents) * 100,
          )
        : 0,
      fill: "#22d3ee",
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-border shadow-lg rounded-lg px-3 py-2 text-sm">
          <p className="font-semibold text-gray-700 mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color || p.fill }} className="text-xs">
              {p.name}: <span className="font-bold">{p.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Platformaning umumiy holati va statistikasi
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            className={`border shadow-sm overflow-hidden group hover:shadow-md transition-all hover:-translate-y-0.5 ${card.border}`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div
                className={`p-2 rounded-lg ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}
              >
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                ) : error ? (
                  <span className="text-sm text-destructive">Xatolik</span>
                ) : (
                  card.value
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Bar + Line */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar Chart: User Overview */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-500" />
              Foydalanuvchilar statistikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[220px] bg-muted animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={barData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Soni" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Line Chart: Monthly Student Trend */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Talabalar o'sishi (oylik)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[220px] bg-muted animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={lineData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="talabalar"
                    name="Talabalar"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Pie + Radial */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pie Chart: Course Status */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-500" />
              Kurslar holati
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {isLoading ? (
              <div className="h-[220px] w-full bg-muted animate-pulse rounded-lg" />
            ) : (stats?.totalCourses || 0) === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                <BookOpen className="h-10 w-10 opacity-20" />
                <p className="text-sm">Hozircha kurslar yo'q</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Radial Bar Chart: Platform Health */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-sky-500" />
              Platforma ko'rsatkichlari (%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[220px] bg-muted animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="90%"
                  data={radialData}
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    label={{
                      position: "insideStart",
                      fill: "#fff",
                      fontSize: 11,
                    }}
                    background
                    dataKey="value"
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, ""]}
                    content={<CustomTooltip />}
                  />
                  <Legend
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            )}
            <div className="flex gap-4 mt-2 justify-center">
              {radialData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: item.fill }}
                  />
                  {item.name}:{" "}
                  <span className="font-bold text-foreground">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Courses Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          Eng Ommabop Kurslar
        </h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : stats?.mostPopularCourses && stats.mostPopularCourses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.mostPopularCourses.map((course) => (
              <Card
                key={course.id}
                className="border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <CardContent className="p-4 flex gap-4">
                  <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 border border-border">
                    <img
                      src={
                        course.thumbnailUrl ||
                        "https://placehold.co/200x200?text=Course"
                      }
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3
                      className="font-semibold text-sm truncate"
                      title={course.title}
                    >
                      {course.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.teacherName}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        <Users className="h-3 w-3" />
                        {course.studentsCount} talaba
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-none bg-muted/50"
                      >
                        {course.rating} ★
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-transparent text-center py-12">
            <CardContent>
              <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">
                Hozircha ommabop kurslar topilmadi
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
