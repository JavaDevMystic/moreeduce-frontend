import { API_ROOT_URL, getApiUrl } from "./api-config";
const BASE_URL = `${API_ROOT_URL}/quizzes`;

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface QuizOptionDto {
  id?: number;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionDto {
  id?: number;
  text: string;
  points: number;
  options: QuizOptionDto[];
}

export interface QuizDto {
  id?: number;
  title: string;
  shuffleQuestions: boolean;
  lessonId?: number;
  moduleId?: number;
  questions: QuizQuestionDto[];
}

export interface QuizAnswerDto {
  questionId: number;
  selectedOptionId: number;
}

export interface QuizSubmitRequest {
  answers: QuizAnswerDto[];
}

export interface QuizResultDto {
  id: number;
  quizId: number;
  quizTitle: string;
  studentId: number;
  studentName: string;
  totalPossiblePoints: number;
  earnedPoints: number;
  scorePercentage: number;
  submittedAt: string;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function quizFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  Object.assign(headers, (options.headers as Record<string, string>) ?? {});

  const url = getApiUrl(endpoint, BASE_URL);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Quiz API error: ${response.statusText}`);
  }

  const ct = response.headers.get("content-type");
  if (ct && ct.includes("application/json")) return response.json();
  return (await response.text()) as unknown as T;
}

// ─── Quiz CRUD ────────────────────────────────────────────────────────────────

export const getQuiz = (quizId: number) => quizFetch<QuizDto>(`/${quizId}`);

export const updateQuiz = (quizId: number, quiz: Partial<QuizDto>) =>
  quizFetch<QuizDto>(`/${quizId}`, {
    method: "PUT",
    body: JSON.stringify(quiz),
  });

export const deleteQuiz = (quizId: number) =>
  quizFetch<void>(`/${quizId}`, { method: "DELETE" });

// ─── Quiz by lesson ───────────────────────────────────────────────────────────

export const getLessonQuiz = (lessonId: number) =>
  quizFetch<QuizDto>(`/lesson/${lessonId}`);

export const createLessonQuiz = (lessonId: number, quiz: Partial<QuizDto>) =>
  quizFetch<QuizDto>(`/lesson/${lessonId}`, {
    method: "POST",
    body: JSON.stringify(quiz),
  });

// ─── Quiz by module ───────────────────────────────────────────────────────────

export const getModuleQuiz = (moduleId: number) =>
  quizFetch<QuizDto>(`/module/${moduleId}`);

export const createModuleQuiz = (moduleId: number, quiz: Partial<QuizDto>) =>
  quizFetch<QuizDto>(`/module/${moduleId}`, {
    method: "POST",
    body: JSON.stringify(quiz),
  });

// ─── Submit quiz ──────────────────────────────────────────────────────────────

export const submitQuiz = (quizId: number, request: QuizSubmitRequest) =>
  quizFetch<QuizResultDto>(`/${quizId}/submit`, {
    method: "POST",
    body: JSON.stringify(request),
  });

// ─── Quiz results ─────────────────────────────────────────────────────────────

export const getQuizResults = (quizId: number) =>
  quizFetch<{ content: QuizResultDto[] }>(`/${quizId}/results`);

export const getMyQuizResults = () =>
  quizFetch<QuizResultDto[]>(`/results/my-results`);
