import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

export function Rating({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const stars = [1, 2, 3, 4, 5];
  const dim = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-1">
      <div className="flex text-warning">
        {stars.map((s) => {
          if (value >= s) return <FaStar key={s} className={dim} />;
          if (value >= s - 0.5) return <FaStarHalfAlt key={s} className={dim} />;
          return <FaRegStar key={s} className={`${dim} text-slate-300 dark:text-slate-600`} />;
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          ({count})
        </span>
      )}
    </div>
  );
}
