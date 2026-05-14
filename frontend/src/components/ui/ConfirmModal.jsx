import Button from "./Button";

function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_12px_40px_rgba(76,89,166,0.18)]">
        <h2 className="font-manrope text-2xl font-extrabold text-[#2D333B]">
          {title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-[#595F69]">
          {description}
        </p>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-12 flex-1 rounded-3xl border border-[rgba(172,178,189,0.2)] bg-white text-sm font-semibold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6]"
          >
            {cancelText}
          </button>

          <Button
            type="button"
            loading={loading}
            fullWidth={false}
            onClick={onConfirm}
            className={`h-12 flex-1 ${
              danger
                ? "bg-red-500 text-white hover:bg-red-600"
                : ""
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;