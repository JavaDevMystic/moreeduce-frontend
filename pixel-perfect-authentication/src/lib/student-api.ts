import { logout } from "./auth-api";
import { API_ROOT_URL, STUDENT_BASE_URL, getApiUrl } from "./api-config";

export interface CourseDto {
  id: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  introVideoUrl?: string;
  price: number;
  category: string;
  language: string;
  rating?: number;
  status?: string;
  teacherId?: number;
  teacherName?: string;
  teacherBio?: string;
  teacherAvatarUrl?: string;
  modules: ModuleDto[];
  modulesCount?: number;
  reviews?: StudentReviewDto[];
  studentsCount?: number;
  public?: boolean;
}

export interface ModuleDto {
  id: number;
  title: string;
  courseId: number;
  lessons: LessonDto[];
}

export interface LessonDto {
  id: number;
  title: string;
  videoUrl: string;
  videoQuality: string;
  videoSize: number;
  transcription: string;
  lessonOrder: number;
  courseId: number;
  moduleId: number;
  fileUrls: string[];
  subtitles?: Record<string, string>;
  locked?: boolean;
  completed?: boolean;
}

export interface StudentReviewDto {
  id: number;
  text: string;
  userId: number;
  userName: string;
  lessonId: number;
  parentCommentId: number | null;
  replies: StudentReviewDto[];
  createdAt: string;
}

export interface ReflectionDto {
  id: number;
  title: string;
  lessonId: number;
  question1: string;
  question2: string;
  question3: string;
  question4: string;
}

export interface ReflectionSubmissionDto {
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  selfScore: number;
}

export interface ReflectionResultDto {
  id: number;
  reflectionId: number;
  studentId: number;
  answer1: string;
  answer2: string;
  answer3: string;
  answer4: string;
  selfScore: number;
  aiScore: number;
  teacherScore: number;
  reflectionIndex: number;
  aiFeedback: string;
  status: string;
  submittedAt: string;
}

export interface TeacherDto {
  id: number;
  firstName: string;
  lastName: string;
  bio?: string;
  resumeUrl?: string;
  certificatesUrl?: string;
  socialMediaLinks?: string;
  coursesCount?: number;
  studentsCount?: number;
}

export interface CourseSearchQuery {
  search?: string;
  category?: string;
  language?: string;
  minRating?: number;
  minPrice?: number;
  maxPrice?: number;
}

async function studentFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (options.headers) {
    const optHeaders = options.headers as Record<string, string>;
    Object.assign(headers, optHeaders);
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const url = getApiUrl(endpoint, STUDENT_BASE_URL);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      logout();
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Xatolik: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type");
  const text = await response.text();

  if (contentType && contentType.includes("application/json")) {
    if (!text || text.trim() === "") {
      return null as unknown as T;
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error(`Student API JSON parse error:`, e, "Response text:", text);
      return text as unknown as T;
    }
  }

  return (text || null) as unknown as T;
}

// Smart fetch — agar token bo'lsa qo'shadi, yo'q bo'lsa ham ishlaydi (Bosh sahifa uchun)
async function publicFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const isPublicRoute =
    endpoint.startsWith("/courses") ||
    endpoint.startsWith("/reflections") ||
    endpoint.startsWith("/assignments") ||
    endpoint.startsWith("/comments") ||
    endpoint.startsWith("/quizzes") ||
    endpoint.startsWith("/certificates");

  const url = isPublicRoute
    ? getApiUrl(endpoint, API_ROOT_URL)
    : getApiUrl(endpoint, STUDENT_BASE_URL);

  let response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...((options.headers as Record<string, string>) || {}),
    },
  });

  // Token bilan 401/403 bo'lsa tokensiz qayta urinib ko'ramiz
  if (
    !response.ok &&
    token &&
    (response.status === 401 || response.status === 403)
  ) {
    const retryHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    response = await fetch(url, {
      ...options,
      headers: retryHeaders,
    });
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Xatolik: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type");
  const text = await response.text();

  if (contentType && contentType.includes("application/json")) {
    if (!text || text.trim() === "") {
      return null as unknown as T;
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error(`Public API JSON parse error:`, e, "Response text:", text);
      return text as unknown as T;
    }
  }

  return (text || null) as unknown as T;
}

// Enrollment
export const enrollInCourse = (courseId: number, receipt?: File) => {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const formData = new FormData();
  if (receipt) formData.append("receipt", receipt);

  const url = getApiUrl(`enrollments?courseId=${courseId}`, API_ROOT_URL);

  return fetch(url, {
    method: "POST",
    headers,
    body: formData,
  }).then(async (response) => {
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        logout();
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Xatolik: ${response.status} ${response.statusText}`,
      );
    }
    const text = await response.text();
    return text || "OK";
  });
};

// Courses
export interface PagedCoursesResponse {
  content: CourseDto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export const getAllCourses = (params?: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  language?: string;
}) => {
  const qs = new URLSearchParams();
  if (params?.query) qs.set("query", params.query);
  if (params?.category) qs.set("category", params.category);
  if (params?.minPrice !== undefined)
    qs.set("minPrice", String(params.minPrice));
  if (params?.maxPrice !== undefined)
    qs.set("maxPrice", String(params.maxPrice));
  if (params?.language) qs.set("language", params.language);
  const queryString = qs.toString();
  return publicFetch<PagedCoursesResponse>(
    `/courses${queryString ? `?${queryString}` : ""}`,
  );
};

export const getEnrolledCourses = () => studentFetch<CourseDto[]>("/courses");

// Bosh sahifa uchun — autentifikatsiyasiz ham ishlaydi
export const searchCourses = (query: CourseSearchQuery) => {
  const qs = new URLSearchParams();
  if (query.search) qs.set("query", query.search);
  if (query.category) qs.set("category", query.category);
  if (query.language) qs.set("language", query.language);
  if (query.minPrice !== undefined) qs.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) qs.set("maxPrice", String(query.maxPrice));
  const queryString = qs.toString();
  return publicFetch<PagedCoursesResponse>(
    `/courses${queryString ? `?${queryString}` : ""}`,
  );
};

// Autentifikatsiya bilan kurs qidirish (talaba uchun)
export const searchCoursesAuth = (query: CourseSearchQuery) => {
  const qs = new URLSearchParams();
  if (query.search) qs.set("query", query.search);
  if (query.category) qs.set("category", query.category);
  if (query.language) qs.set("language", query.language);
  if (query.minPrice !== undefined) qs.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== undefined) qs.set("maxPrice", String(query.maxPrice));
  const queryString = qs.toString();
  return publicFetch<PagedCoursesResponse>(
    `/courses${queryString ? `?${queryString}` : ""}`,
  );
};

export const getCourseDetails = (courseId: number) =>
  publicFetch<CourseDto>(`/courses/${courseId}`);

export const getCourseLessons = (courseId: number) =>
  publicFetch<LessonDto[]>(`/courses/${courseId}/lessons`);

// Progress
export const updateLessonProgress = (lessonId: number, position: number) =>
  studentFetch<string>(`/lessons/${lessonId}/progress?position=${position}`, {
    method: "POST",
  });

export const completeLesson = (lessonId: number) =>
  studentFetch<string>(`/lessons/${lessonId}/complete`, {
    method: "POST",
  });

export const restartCourseProgress = (courseId: number) =>
  studentFetch<string>(`/courses/${courseId}/restart`, {
    method: "POST",
  });

// Teachers
export const getAllTeachers = () => studentFetch<TeacherDto[]>("/teachers");

// Assignments
export const getLessonAssignment = (lessonId: number) =>
  publicFetch<any>(`/assignments/lesson/${lessonId}`);

export const submitAssignment = (
  assignmentId: number,
  submissionContent: string,
  file?: File,
) => {
  const fd = new FormData();
  fd.append(
    "request",
    new Blob([JSON.stringify({ submissionContent })], {
      type: "application/json",
    }),
  );
  if (file) fd.append("file", file);

  return publicFetch<any>(`/assignments/${assignmentId}/submit`, {
    method: "POST",
    body: fd,
  });
};

export const getMySubmission = (assignmentId: number) =>
  publicFetch<any>(`/assignments/${assignmentId}/my-submission`);

// Keep old name as alias for backward compatibility
export const getAssignmentResult = getMySubmission;

// Reflections
export const getMyReflectionResult = (lessonId: number) =>
  publicFetch<ReflectionSubmissionDto>(
    `/reflections/lesson/${lessonId}/my-result`,
  );

export const submitReflection = (
  reflectionId: number,
  submission: ReflectionSubmissionDto,
) =>
  publicFetch<ReflectionSubmissionDto>(`/reflections/${reflectionId}/submit`, {
    method: "POST",
    body: JSON.stringify({
      answer1: submission.answer1,
      answer2: submission.answer2,
      answer3: submission.answer3,
      answer4: submission.answer4,
      selfScore: submission.selfScore,
    }),
  });

export const getLessonReflection = (lessonId: number) =>
  publicFetch<ReflectionDto>(`/reflections/lesson/${lessonId}`);

// Comments & Reviews
// Lesson Comments
export const getLessonComments = (lessonId: number) =>
  publicFetch<StudentReviewDto[]>(`/comments/lessons/${lessonId}`);

export const addLessonComment = (lessonId: number, text: string) =>
  publicFetch<StudentReviewDto>(`/comments/lessons/${lessonId}`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const replyToComment = (parentCommentId: number, text: string) =>
  publicFetch<StudentReviewDto>(`/comments/${parentCommentId}/replies`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
