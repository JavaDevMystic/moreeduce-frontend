import { Link } from "react-router-dom";

interface CourseCardProps {
  id?: number;
  thumbnailUrl: string;
  category: string;
  teacherName?: string;
  title: string;
  studentsCount?: number;
  price: number;
  modulesCount?: number;
}

const CourseCard = ({
  id,
  thumbnailUrl,
  category,
  teacherName,
  title,
  studentsCount,
  price,
  modulesCount,
}: CourseCardProps) => {
  return (
    <Link
      to={`/course/${id}`}
      className="block border border-border rounded-xl overflow-hidden hover:shadow-xl transition-all bg-white group cursor-pointer"
    >
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="h-16 w-16 text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.069A1 1 0 0121 8.867v6.266a1 1 0 01-1.447.902L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
              />
            </svg>
          </div>
        )}
        <span className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
          {category}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs text-muted-foreground mb-1 font-medium">
          by {teacherName || "O'qituvchi"}
        </p>
        <h3 className="font-bold text-slate-800 text-base mb-3 line-clamp-2 h-12">
          {title}
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 border-b pb-4">
          <span className="flex items-center gap-1.5 font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            {(studentsCount || 0).toLocaleString()} o'quvchi
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            {modulesCount || 0} modul
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            Online
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            {price === 0 ? "Bepul" : `${price.toLocaleString()} so'm`}
          </span>
          <span className="text-sm font-bold text-primary group-hover:text-primary/80 flex items-center gap-1 transition-colors">
            Ko'rish →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
