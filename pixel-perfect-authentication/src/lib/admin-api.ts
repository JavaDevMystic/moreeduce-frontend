import {logout} from "./auth-api";
import {ADMIN_BASE_URL, getApiUrl} from "./api-config";

const BASE_URL = ADMIN_BASE_URL;

export interface AdminDashboardStats {
    totalStudents: number;
    totalTeachers: number;
    newUsersThisMonth: number;
    totalCourses: number;
    pendingCourses: number;
    mostPopularCourses: AdminCourse[];
    totalRevenue: number;
    pendingWithdrawals: number;
}

export interface AdminUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";
    resumeUrl: string;
    certificatesUrl: string;
    socialMediaLinks: string;
    bio: string;
    profileCompletionPercentage: number;
    verified: boolean;
    blocked: boolean;
}

export interface AdminCourse {
    id: number;
    title: string;
    description: string;
    thumbnailUrl: string;
    price: number;
    category: string;
    language: string;
    rating: number;
    status: "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";
    teacherId: number;
    teacherName: string;
    modules: any[];
    modulesCount?: number;
    studentsCount: number;
    public: boolean;
}

export interface AdminWithdrawal {
    id: number;
    teacherId: number;
    teacherName: string;
    amount: number;
    cardNumber: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    requestedAt: string;
    processedAt: string;
    createdAt: string;
}

export interface AdminPlatformPayment {
    id: number;
    teacherId: number;
    teacherName: string;
    amount: number;
    paymentReceiptUrl: string;
    status: "PENDING" | "APPROVED" | "ACTIVE" | "REJECTED";
    createdAt: string;
}

// ==================== ENROLLMENTS ====================

export interface AdminEnrollment {
    enrollmentId: number;
    studentId: number;
    studentName: string;
    courseId: number;
    courseName: string;
    paymentReceiptUrl?: string;
    status: "PENDING" | "APPROVED" | "ACTIVE" | "REJECTED";
    enrolledAt: string;
}

export interface AdminComment {
    id: number;
    text: string;
    userId: number;
    userName: string;
    lessonId: number;
    parentCommentId: number;
    replies: any[];
    createdAt: string;
}

export interface AuditLog {
    id: number;
    action: string;
    description: string;
    performedBy: string;
    timestamp: string;
}

export interface PlatformSetting {
    key: string;
    value: string;
}

export interface CourseStats {
    courseId: number;
    totalStudents: number;
    meanScore: number;
    standardDeviation: number;
    minScore: number;
    maxScore: number;
}

export interface StudentProgress {
    studentId: number;
    studentName: string;
    averageScore: number;
    totalActivityCount: number;
    lastActiveAt: string;
    progressHistory: Record<string, number>;
    moduleResults: {
        moduleTitle: string;
        quizScore: number;
        reflectionScore: number;
    }[];
}

async function adminFetch<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    if (options.body && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const url = getApiUrl(endpoint, BASE_URL);

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...((options.headers as Record<string, string>) || {}),
        },
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            logout();
        }

        const errorData = await response.json().catch(() => ({}));
        const message =
            errorData.message ||
            errorData.error ||
            `Xatolik: ${response.status} ${response.statusText}`;

        throw new Error(message);
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
            console.error(
                `Admin API JSON parse error at ${endpoint}:`,
                e,
                "Body:",
                text,
            );
            throw new Error("Serverdan noto'g'ri ma'lumot keldi (JSON parse error)");
        }
    }

    return (text || null) as unknown as T;
}

// ==================== DASHBOARD ====================
export const getAdminStats = () =>
    adminFetch<AdminDashboardStats>("/dashboard");

// ==================== USERS ====================
export const getAdminUsers = () => adminFetch<AdminUser[]>("/users");

export const verifyUser = (userId: number) =>
    adminFetch<AdminUser>(`/users/${userId}/verify`, {method: "PUT"});

export const blockUser = (userId: number) =>
    adminFetch<string>(`/users/${userId}/block`, {method: "PUT"});

export const unblockUser = (userId: number) =>
    adminFetch<string>(`/users/${userId}/unblock`, {method: "PUT"});

export const deleteUser = (userId: number) =>
    adminFetch<string>(`/users/${userId}`, {method: "DELETE"});

export const updateUser = (
    userId: number,
    data: {
        firstName?: string;
        lastName?: string;
        email?: string;
        role?: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";
    },
) =>
    adminFetch<AdminUser>(`/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });

// ==================== COURSES ====================
export const getAdminCourses = () => adminFetch<AdminCourse[]>("/courses");

export const approveCourse = (courseId: number) =>
    adminFetch<string>(`/courses/${courseId}/approve`, {method: "PUT"});

export const rejectCourse = (courseId: number) =>
    adminFetch<string>(`/courses/${courseId}/reject`, {method: "PUT"});

export const deleteCourse = (courseId: number) =>
    adminFetch<string>(`/courses/${courseId}`, {method: "DELETE"});

export const updateAdminCourse = (
    courseId: number,
    data: {
        title?: string;
        description?: string;
        price?: number;
        public?: boolean;
    },
) =>
    adminFetch<AdminCourse>(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify(data),
    });

// ==================== WITHDRAWALS ====================
export const getAdminWithdrawals = () =>
    adminFetch<AdminWithdrawal[]>("/withdrawals");

export const approveWithdrawal = (requestId: number) =>
    adminFetch<void>(`/withdrawals/${requestId}/approve`, {
        method: "PUT",
    });

export const rejectWithdrawal = (requestId: number, reason: string) =>
    adminFetch<void>(`/withdrawals/${requestId}/reject`, {
        method: "PUT",
        body: JSON.stringify({reason}),
    });

// ==================== PLATFORM PAYMENTS ====================
export const getAdminPayments = () =>
    adminFetch<AdminPlatformPayment[]>("/platform-payments");

export const approvePayment = (paymentId: number, status: string) =>
    adminFetch<AdminPlatformPayment>(
        `/platform-payments/${paymentId}/approve?status=${status}`,
        {method: "PUT"},
    );

// ==================== COMMENTS ====================
export const getAdminComments = () => adminFetch<AdminComment[]>("/comments");

export const deleteComment = (commentId: number) =>
    adminFetch<void>(`/comments/${commentId}`, {method: "DELETE"});

// ==================== AUDIT LOGS ====================
export const getAuditLogs = () => adminFetch<AuditLog[]>("/audit-logs");

export const deleteAuditLogs = (beforeDate: string) =>
    adminFetch<void>(`/audit-logs?beforeDate=${beforeDate}`, {
        method: "DELETE",
    });

export const getAuditLogsByUser = (email: string) =>
    adminFetch<AuditLog[]>(`/audit-logs/user/${encodeURIComponent(email)}`);

export const getAuditLogsByAction = (action: string) =>
    adminFetch<AuditLog[]>(`/audit-logs/action/${encodeURIComponent(action)}`);

// ==================== PLATFORM SETTINGS ====================
export const getPlatformSettings = () =>
    adminFetch<PlatformSetting[]>("/settings");

export const updatePlatformSetting = (key: string, value: string) =>
    adminFetch<PlatformSetting>(`/settings/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({value}),
    });

// ==================== STATISTICS ====================
export const getCourseStats = (courseId: number) =>
    adminFetch<CourseStats>(`/statistics/course/${courseId}`);

export const getStudentStats = (studentId: number) =>
    adminFetch<StudentProgress>(`/statistics/student/${studentId}`);

export const compareCoursesStats = (courseId1: number, courseId2: number) =>
    adminFetch<Record<string, number>>(
        `/statistics/compare-courses?courseId1=${courseId1}&courseId2=${courseId2}`,
    );

export interface AdminEnrollment {
    enrollmentId: number;
    studentId: number;
    studentName: string;
    courseId: number;
    courseName: string;
    paymentReceiptUrl?: string;
    status: "PENDING" | "APPROVED" | "ACTIVE" | "REJECTED";
    enrolledAt: string;
}

// ==================== ENROLLMENTS ====================

/**

 * Pending enrollmentlar ro'yxati
 *
 * GET /api/v1/admin/enrollments/pending
 */
export const getAdminEnrollments = () =>
    adminFetch<AdminEnrollment[]>(
        "/enrollments/pending"
    );

/**

 * Enrollment statusini o'zgartirish
 *
 * PUT /api/v1/admin/enrollments/{id}/status?status=APPROVED
 * PUT /api/v1/admin/enrollments/{id}/status?status=REJECTED
 */
export const updateEnrollmentStatus = (
    enrollmentId: number,
    status: "APPROVED" | "REJECTED",
) =>
    adminFetch<void>(
        `/enrollments/${enrollmentId}/status?status=${status}`,
        {
            method: "PUT",
        },
    );

/**

 * Enrollmentni tasdiqlash
 */
export const approveEnrollment = (
    enrollmentId: number,
) =>
    adminFetch<void>(
        `/enrollments/${enrollmentId}/status?status=APPROVED`,
        {
            method: "PUT",
        },
    );

/**

 * Enrollmentni rad etish
 */
export const rejectEnrollment = (
    enrollmentId: number,
) =>
    adminFetch<void>(
        `/enrollments/${enrollmentId}/status?status=REJECTED`,
        {
            method: "PUT",
        },
    );
