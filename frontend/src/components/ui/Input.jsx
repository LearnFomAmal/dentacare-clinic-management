import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

function Input({
  label,
  type = "text",
  placeholder,
  error,
  register,
  name,
}) {
  const [showPassword, setShowPassword] =
    useState(false);

  const isPassword =
    type === "password";

  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          className="
          text-xs
          font-semibold
          uppercase
          tracking-[0.6px]
          text-[#595F69]
        "
        >
          {label}
        </label>
      )}

      <div className="relative">
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
            h-12
            w-full
            rounded-lg
            border
            bg-white
            px-4
            pr-12
            text-sm
            text-[#2D333B]
            placeholder:text-[#6B7280]
            outline-none
            transition-all
            duration-200

            ${
              error
                ? "border-red-500"
                : "border-[rgba(172,178,189,0.2)]"
            }

            focus:border-[#4C59A6]
          `}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
            className="
              absolute
              right-4
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default Input;