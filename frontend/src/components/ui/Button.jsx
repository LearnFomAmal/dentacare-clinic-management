import { cn } from "../../utils/cn";

function Button({
  children,
  className,
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = true,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        `
        h-14
        rounded-3xl
        bg-[#B8B8FF]
        px-6
        text-base
        font-semibold
        text-[#2D333B]
        transition-all
        duration-200
        hover:opacity-90
        disabled:cursor-not-allowed
        disabled:opacity-70
        shadow-sm
      `,
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? "Please wait..." : children}
    </button>
  );
}

export default Button;