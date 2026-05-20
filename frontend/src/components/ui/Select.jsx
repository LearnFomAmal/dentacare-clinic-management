function Select({
  label,
  name,
  register,
  error,
  children,
  className = "",
  selectClassName = "",
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

      <select
        id={name}
        {...registeredField}
        {...props}
        className={`h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 text-sm text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 ${
          error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""
        } ${selectClassName}`}
      >
        {children}
      </select>

      {error?.message && (
        <p className="text-xs font-medium text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default Select;