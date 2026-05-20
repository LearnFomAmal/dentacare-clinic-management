function Textarea({
  label,
  name,
  placeholder = "",
  register,
  error,
  rows = 4,
  className = "",
  textareaClassName = "",
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
          className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69] dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        {...registeredField}
        {...props}
        className={`w-full resize-none rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 py-3 text-sm text-[#2D333B] outline-none transition placeholder:text-[#8B93A5] focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 ${
          error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""
        } ${textareaClassName}`}
      />

      {error?.message && (
        <p className="text-xs font-medium text-red-500">
          {error.message}
        </p>
      )}
    </div>
  );
}

export default Textarea;