import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function Input({
  label,
  type = "text",
  placeholder,
  error,
  register,
  name,
  icon: Icon,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(172,178,189,0.85)]"
          />
        )}

        <input
          type={
            isPassword
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          placeholder={placeholder}
          {...register(name)}
          className={`
            h-[49px]
            w-full
            rounded-lg
            border
            bg-white
            text-sm
            font-normal
            text-[#2D333B]
            placeholder:text-sm
            placeholder:text-[#6B7280]
            outline-none
            transition-all
            duration-200

            ${Icon ? "pl-11" : "pl-4"}
            ${isPassword ? "pr-12" : "pr-4"}

            ${
              error
                ? "border-red-500"
                : "border-[rgba(172,178,189,0.2)]"
            }

            focus:border-[#4C59A6]
            focus:ring-2
            focus:ring-[#4C59A6]/10
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs font-medium text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default Input;