function Select({
  label,
  name,
  register,
  error,
  children,
}) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
          {label}
        </label>
      )}

      <select
        {...register(name)}
        className={`h-[49px] w-full rounded-lg border bg-white px-4 text-sm text-[#2D333B] outline-none transition-all duration-200 focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 ${
          error
            ? "border-red-500"
            : "border-[rgba(172,178,189,0.2)]"
        }`}
      >
        {children}
      </select>

      {error && (
        <p className="text-xs font-medium text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default Select;