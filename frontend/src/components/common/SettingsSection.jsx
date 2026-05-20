function SettingsSection({
  title,
  description,
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-3xl border border-[rgba(172,178,189,0.1)] bg-white p-6 shadow-[0_12px_40px_rgba(76,89,166,0.08)] transition-colors dark:border-slate-800 dark:bg-slate-900 dark:shadow-none md:p-8 ${className}`}
    >
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="font-manrope text-xl font-extrabold text-[#2D333B] dark:text-slate-100">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-1 text-sm text-[#595F69] dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}

      {children}
    </section>
  );
}

export default SettingsSection;