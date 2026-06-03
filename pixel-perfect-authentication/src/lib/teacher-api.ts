import { logout } from "./auth-api";
import { TEACHER_BASE_URL, API_ROOT_URL, getApiUrl } from "./api-config";
const BASE_URL = TEACHER_BASE_URL;

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface LessonDto {
  id?: number;
  title: string;
  videoUrl?: string;
  videoQuality?: string;
  videoSize?: number;
  transcription?: string;
  lessonOrder: number;
  courseId?: number;
  moduleId?: number;
  fileUrls?: string[];
  subtitles?: Record<string, string>;
  locked?: boolean;
  completed?: boolean;
}

export interface ModuleDto {
  id?: number;
  title: string;
  courseId?: number;
  moduleOrder?: number;
  lessons: LessonDto[];
}

export interface CourseDto {
  id?: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  price: number;
  category: string;
  language: string;
  rating?: number;
  status?: "PENDING" | "APPROVED" | "DRAFT" | "REJECTED";
  teacherId?: number;
  teacherName?: string;
  teacherBio?: string;
  teacherAvatarUrl?: string;
  modules: ModuleDto[];
  modulesCount?: number;
  studentsCount?: number;
  public?: boolean;
}

export interface TeacherProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  resumeUrl?: string;
  certificatesUrl?: string;
  socialMediaLinks?: string;
  bio?: string;
  profileCompletionPercentage?: number;
  verified?: boolean;
  blocked?: boolean;
}

export interface WithdrawalDto {
  id?: number;
  teacherId?: number;
  teacherName?: string;
  amount: number;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  adminComment?: string;
  requestedAt?: string;
  processedAt?: string;
}

export interface PlatformPaymentDto {
  id?: number;
  teacherId?: number;
  teacherName?: string;
  amount: number;
  paymentReceiptUrl?: string;
  status?: "PENDING" | "APPROVED" | "ACTIVE" | "REJECTED";
  createdAt?: string;
}

export interface QuizDto {
  id?: number;
  title: string;
  shuffleQuestions?: boolean;
  lessonId?: number;
  moduleId?: number;
  questions: QuestionDto[];
}

export interface QuestionDto {
  id?: number;
  text: string;
  points?: number;
  options: AnswerOptionDto[];
}

export interface AnswerOptionDto {
  id?: number;
  text: string;
  isCorrect: boolean;
}

export interface AssignmentDto {
  id?: number;
  title: string;
  description: string;
  lessonId?: number;
}

export interface ReflectionDto {
  id?: number;
  title: string;
  lessonId: number;
  question1: string;
  question2: string;
  question3: string;
  question4: string;
}

export interface ReflectionResultDto {
  id?: number;
  reflectionId: number;
  studentId?: number;
  studentName?: string;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  selfScore: number;
  aiScore?: number;
  teacherScore?: number;
  reflectionIndex?: number;
  aiFeedback?: string;
  status?: "PENDING" | "RESUBMIT" | "GRADED";
  submittedAt?: string;
}

export interface AssignmentSubmissionDto {
  id?: number;
  assignmentId?: number;
  studentId?: number;
  studentName?: string;
  submissionContent?: string;
  fileUrl?: string;
  grade?: number;
  teacherFeedback?: string;
  status?: "PENDING" | "RESUBMIT" | "GRADED";
  submittedAt?: string;
}

export interface CourseSearchQuery {
  search?: string;
  category?: string;
  language?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  baseUrl: string = BASE_URL,
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};

  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (options.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (headers["Content-Type"] === "none") delete headers["Content-Type"];

  const url = getApiUrl(endpoint, baseUrl);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      logout();
    }
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.message || `Xatolik: ${response.status} ${response.statusText}`,
    );
  }

  const ct = response.headers.get("content-type");
  const text = await response.text();

  if (ct && ct.includes("application/json")) {
    if (!text || text.trim() === "") {
      return null as unknown as T;
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error(`Teacher API JSON parse error:`, e, "Response text:", text);
      return text as unknown as T;
    }
  }

  return (text || null) as unknown as T;
}

// Shorthand for calling course-management endpoints (root-level, not under /teacher/)
const rootFetch = <T>(endpoint: string, options: RequestInit = {}) =>
  apiFetch<T>(endpoint, options, API_ROOT_URL);

// ─── Teacher Profile ──────────────────────────────────────────────────────────
// These correctly stay under /teacher/ (TEACHER_BASE_URL)

export const getTeacherProfile = () =>
  apiFetch<TeacherProfile>("/teacher/profile", {}, API_ROOT_URL);

export const updateTeacherProfile = (data: {
  bio?: string;
  resumeUrl?: string;
  certificatesUrl?: string;
  socialMediaLinks?: string;
}) =>
  apiFetch<string>(
    "/teacher/profile",
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
    API_ROOT_URL,
  );

// ─── Teacher Courses ──────────────────────────────────────────────────────────
// All course endpoints are at /api/v1/courses/* (root-level), not under /teacher/

export const getTeacherCourses = () =>
  rootFetch<CourseDto[]>("/courses/my-courses");

export const createCourse = (course: Partial<CourseDto>) =>
  rootFetch<CourseDto>("/courses", {
    method: "POST",
    body: JSON.stringify(course),
  });

export const uploadCourseThumbnail = (courseId: number, thumbnail: File) => {
  const fd = new FormData();
  fd.append("file", thumbnail);
  return rootFetch<CourseDto>(`/courses/${courseId}/thumbnail`, {
    method: "POST",
    body: fd,
    headers: { "Content-Type": "none" },
  });
};

export const uploadLessonSubtitles = (
  lessonId: number,
  file: File,
  languageCode: string = "uz",
) => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("languageCode", languageCode);
  return rootFetch<LessonDto>(`/courses/lessons/${lessonId}/subtitle`, {
    method: "POST",
    body: fd,
    headers: { "Content-Type": "none" },
  });
};

export const uploadLessonAttachments = (lessonId: number, files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return rootFetch<LessonDto>(`/courses/lessons/${lessonId}/attachments`, {
    method: "POST",
    body: fd,
    headers: { "Content-Type": "none" },
  });
};

export const uploadCourseVideo = (courseId: number, videoFile: File) => {
  const fd = new FormData();
  fd.append("videoFile", videoFile);
  return rootFetch<CourseDto>(`/courses/${courseId}/video`, {
    method: "POST",
    body: fd,
    headers: { "Content-Type": "none" },
  });
};

export const setCourseVisibility = (courseId: number, isPublic: boolean) =>
  apiFetch<void>(
    `/teacher/courses/${courseId}/visibility?isPublic=${isPublic}`,
    { method: "PUT" },
    API_ROOT_URL,
  );

export const updateCourseStatus = (
  courseId: number,
  status: "PENDING" | "APPROVED" | "DRAFT" | "REJECTED",
) =>
  rootFetch<void>(`/courses/${courseId}/status?status=${status}`, {
    method: "PUT",
  });

// ─── Teacher Modules ──────────────────────────────────────────────────────────
// Swagger: POST /api/v1/courses/{courseId}/modules

export const createModule = (courseId: number, module: Partial<ModuleDto>) =>
  rootFetch<ModuleDto>(`/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify(module),
  });

// ─── Teacher Lessons ──────────────────────────────────────────────────────────
// Swagger: POST /api/v1/courses/modules/{moduleId}/lessons

export const createLesson = (moduleId: number, lesson: Partial<LessonDto>) =>
  rootFetch<LessonDto>(`/courses/modules/${moduleId}/lessons`, {
    method: "POST",
    body: JSON.stringify(lesson),
  });

// Swagger: POST /api/v1/courses/modules/reorder
export const reorderModules = (itemIds: number[]) =>
  rootFetch<void>("/courses/modules/reorder", {
    method: "POST",
    body: JSON.stringify({ itemIds }),
  });

// Swagger: POST /api/v1/courses/lessons/reorder
export const reorderLessons = (itemIds: number[]) =>
  rootFetch<void>("/courses/lessons/reorder", {
    method: "POST",
    body: JSON.stringify({ itemIds }),
  });

// Swagger: POST /api/v1/courses/lessons/{lessonId}/video
export const uploadLessonVideo = (lessonId: number, videoFile: File) => {
  const fd = new FormData();
  fd.append("videoFile", videoFile);
  return rootFetch<LessonDto>(`/courses/lessons/${lessonId}/video`, {
    method: "POST",
    body: fd,
    headers: { "Content-Type": "none" },
  });
};

// ─── Teacher Quizzes ──────────────────────────────────────────────────────────
// Swagger: POST /api/v1/quizzes/lesson/{lessonId}

export const createLessonQuiz = (lessonId: number, quiz: Partial<QuizDto>) =>
  rootFetch<QuizDto>(`/quizzes/lesson/${lessonId}`, {
    method: "POST",
    body: JSON.stringify(quiz),
  });

// ─── Teacher Reflections ──────────────────────────────────────────────────────
// Swagger: reflections are at /api/v1/reflections/* (root-level)

export const createLessonReflection = (
  lessonId: number,
  reflection: Partial<ReflectionDto>,
) =>
  rootFetch<ReflectionDto>(`/reflections/lesson/${lessonId}`, {
    method: "POST",
    body: JSON.stringify(reflection),
  });

export const getLessonReflection = (lessonId: number) =>
  rootFetch<ReflectionDto>(`/reflections/lesson/${lessonId}`);

export const updateReflection = (
  reflectionId: number,
  reflection: Partial<ReflectionDto>,
) =>
  rootFetch<ReflectionDto>(`/reflections/${reflectionId}`, {
    method: "PUT",
    body: JSON.stringify(reflection),
  });

export const deleteReflection = (reflectionId: number) =>
  rootFetch<void>(`/reflections/${reflectionId}`, { method: "DELETE" });

export const gradeReflectionSubmission = (
  submissionId: number,
  score: number,
) =>
  rootFetch<ReflectionResultDto>(
    `/reflections/submissions/${submissionId}/grade?score=${score}`,
    { method: "PUT" },
  );

export const getReflectionSubmissions = (reflectionId: number) =>
  rootFetch<ReflectionResultDto[]>(`/reflections/${reflectionId}/submissions`);

// ─── Teacher Assignments ──────────────────────────────────────────────────────
// Swagger: assignments are at /api/v1/assignments/* (root-level)

export const createLessonAssignment = (
  lessonId: number,
  assignment: Partial<AssignmentDto>,
) =>
  rootFetch<AssignmentDto>(`/assignments/lesson/${lessonId}`, {
    method: "POST",
    body: JSON.stringify(assignment),
  });

export const getLessonAssignment = (lessonId: number) =>
  rootFetch<AssignmentDto>(`/assignments/lesson/${lessonId}`);

export const updateAssignment = (
  assignmentId: number,
  assignment: Partial<AssignmentDto>,
) =>
  rootFetch<AssignmentDto>(`/assignments/${assignmentId}`, {
    method: "PUT",
    body: JSON.stringify(assignment),
  });

export const deleteAssignment = (assignmentId: number) =>
  rootFetch<void>(`/assignments/${assignmentId}`, { method: "DELETE" });

export const gradeSubmission = (
  submissionId: number,
  grade: number,
  feedback: string,
) =>
  rootFetch<void>(`/assignments/submissions/${submissionId}/grade`, {
    method: "POST",
    body: JSON.stringify({ grade, feedback, status: "GRADED" }),
  });

export const getLessonSubmissions = (assignmentId: number) =>
  rootFetch<AssignmentSubmissionDto[]>(
    `/assignments/${assignmentId}/submissions`,
  );

// ─── Teacher Enrollments ──────────────────────────────────────────────────────
// Swagger: PUT /api/v1/teacher/enrollments/{enrollmentId}/status

export const approveEnrollment = (
  enrollmentId: number,
  status: "PENDING" | "APPROVED" | "ACTIVE" | "REJECTED",
) =>
  apiFetch<string>(
    `/teacher/enrollments/${enrollmentId}/status?status=${status}`,
    { method: "PUT" },
    API_ROOT_URL,
  );

// ─── Teacher Withdrawals ──────────────────────────────────────────────────────
// Swagger: GET/POST /api/v1/teacher/withdrawals

export const getTeacherWithdrawals = () =>
  apiFetch<WithdrawalDto[]>("/teacher/withdrawals", {}, API_ROOT_URL);

export const requestWithdrawal = (data: Partial<WithdrawalDto>) =>
  apiFetch<WithdrawalDto>(
    "/teacher/withdrawals",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    API_ROOT_URL,
  );

// ─── Teacher Platform Payments ────────────────────────────────────────────────
// Swagger: GET /api/v1/teacher/platform-payments

export const getTeacherPayments = () =>
  apiFetch<PlatformPaymentDto[]>(
    "/teacher/platform-payments",
    {},
    API_ROOT_URL,
  );

export const submitPlatformPayment = (amount: number, receipt: File) => {
  const fd = new FormData();
  fd.append("receipt", receipt);
  return apiFetch<PlatformPaymentDto>(
    `/teacher/platform-payments?amount=${amount}`,
    { method: "POST", body: fd, headers: { "Content-Type": "none" } },
    API_ROOT_URL,
  );
};

// ─── Teacher Dashboard Stats ──────────────────────────────────────────────────
// Swagger: all dashboard stats are at /api/v1/teacher/dashboard/* (root-level)

export const getDashboardTotalStudents = () =>
  apiFetch<number>("/teacher/dashboard/total-students", {}, API_ROOT_URL);

export const getDashboardPendingSubmissions = () =>
  apiFetch<any>("/teacher/dashboard/pending-submissions", {}, API_ROOT_URL);

export const getDashboardPendingEnrollments = () =>
  apiFetch<any>("/teacher/dashboard/pending-enrollments", {}, API_ROOT_URL);

export const getDashboardMonthlyRevenue = () =>
  apiFetch<number>("/teacher/dashboard/monthly-revenue", {}, API_ROOT_URL);

export const getDashboardMostPopularCourse = () =>
  apiFetch<CourseDto | null>(
    "/teacher/dashboard/most-popular-course",
    {},
    API_ROOT_URL,
  );

// ─── Public Course Endpoints ──────────────────────────────────────────────────
// These are under /api/v1/courses (root-level), not /teacher/courses

export const getCourseDetails = (courseId: number) =>
  rootFetch<CourseDto>(`/courses/${courseId}`);

export const updateCourse = (id: number, course: Partial<CourseDto>) =>
  rootFetch<CourseDto>(`/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(course),
  });

export const deleteCourse = (id: number) =>
  rootFetch<void>(`/courses/${id}`, { method: "DELETE" });

// Swagger: PUT /api/v1/courses/modules/{moduleId}
export const updateModule = (moduleId: number, module: Partial<ModuleDto>) =>
  rootFetch<ModuleDto>(`/courses/modules/${moduleId}`, {
    method: "PUT",
    body: JSON.stringify(module),
  });

// Swagger: DELETE /api/v1/courses/modules/{moduleId}
export const deleteModule = (moduleId: number) =>
  rootFetch<void>(`/courses/modules/${moduleId}`, { method: "DELETE" });

// Swagger: PUT /api/v1/courses/lessons/{lessonId}
export const updateLesson = (lessonId: number, lesson: Partial<LessonDto>) =>
  rootFetch<LessonDto>(`/courses/lessons/${lessonId}`, {
    method: "PUT",
    body: JSON.stringify(lesson),
  });

// Swagger: DELETE /api/v1/courses/lessons/{lessonId}
export const deleteLesson = (lessonId: number) =>
  rootFetch<void>(`/courses/lessons/${lessonId}`, { method: "DELETE" });

export const searchCourses = (query: CourseSearchQuery) => {
  const params = new URLSearchParams();
  if (query.search) params.set("query", query.search);
  if (query.category) params.set("category", query.category);
  if (query.language) params.set("language", query.language);
  if (query.minPrice !== undefined)
    params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined)
    params.set("maxPrice", String(query.maxPrice));
  return rootFetch<{
    content: CourseDto[];
    totalElements: number;
    totalPages: number;
  }>(`/courses?${params.toString()}`);
};
