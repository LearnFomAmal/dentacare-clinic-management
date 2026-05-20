function Input({
  label,
  name,
  type = "text",
  placeholder = "",
  register,
  error,
  icon: Icon,
  className = "",
  inputClassName = "",
  ...props
}) {
  const registeredField =
    typeof register === "function" && name
      ? register(name)
      : {};

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A5ADBB]"
          />
        )}

        <input
          id={name}
          type={type}
          placeholder={placeholder}
          {...registeredField}
          {...props}
          className={`h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white ${
            Icon ? "pl-11" : "pl-4"
          } pr-4 text-sm text-[#2D333B] outline-none transition placeholder:text-[#8B93A5] focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 ${
            error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""
          } ${inputClassName}`}
        />
      </div>

      {error?.message && (
        <p className="text-xs font-medium text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default Input;