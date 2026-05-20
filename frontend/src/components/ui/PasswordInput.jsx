import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

function PasswordInput({
  label,
  name,
  placeholder = "••••••••",
  register,
  error,
  className = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);

  const registeredField =
    typeof register === "function" && name
      ? register(name)
      : {};

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69] dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <Lock
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A5ADBB]"
        />

        <input
          id={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...registeredField}
          {...props}
          className={`h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white pl-11 pr-12 text-sm text-[#2D333B] outline-none transition placeholder:text-[#8B93A5] focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : ""
          }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B93A5] transition hover:text-[#4C59A6]"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error?.message && (
        <p className="text-xs font-medium text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default PasswordInput;