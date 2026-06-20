import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import toast from "react-hot-toast";
function ReviewFormModal({
  open,
  loading = false,
  mode = "create",
  initialReview = null,
  appointment = null,
  onClose,
  onSubmit,
}) {
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;

    if (initialReview) {
      setRating(Number(initialReview.rating || 5));
      setDescription(initialReview.description || "");
      return;
    }

    setRating(5);
    setDescription("");
  }, [open, initialReview]);

  if (!open) return null;

  const doctorName = appointment?.doctorId
    ? `Dr. ${[appointment.doctorId.firstName, appointment.doctorId.lastName]
        .filter(Boolean)
        .join(" ")}`
    : "Doctor";

 const handleSubmit = (event) => {
  event.preventDefault();

  const cleanDescription = description.trim();

  if (!cleanDescription) {
    toast.error("Review description is required");
    return;
  }

  if (cleanDescription.length < 10) {
    toast.error("Review must be at least 10 characters");
    return;
  }

  if (Number(rating) < 1 || Number(rating) > 5) {
    toast.error("Rating must be between 1 and 5");
    return;
  }

  onSubmit({
    rating,
    description: cleanDescription,
  });
};

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[560px] rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#111827]">
              {mode === "edit" ? "Edit Review" : "Submit Review"}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Share your treatment experience with {doctorName}. Your review
              will be visible after admin approval.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#6B7280] transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-extrabold text-[#111827]">
              Rating
            </label>

            <div className="mt-3 flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const active = value <= rating;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    disabled={loading}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                      active
                        ? "border-[#F59E0B] bg-yellow-50 text-[#F59E0B]"
                        : "border-[#E5E7EB] bg-white text-[#CBD5E1]"
                    }`}
                  >
                    <Star
                      size={22}
                      fill={active ? "currentColor" : "none"}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-extrabold text-[#111827]">
              Review Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              disabled={loading}
              placeholder="Write your honest experience..."
              className="mt-3 w-full resize-none rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-semibold text-[#111827] outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-12 rounded-2xl px-5 text-sm font-extrabold text-[#6B7280] transition hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="h-12 min-w-[160px] rounded-2xl bg-[#9381FF] px-6 text-sm font-extrabold text-white transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Saving..."
                : mode === "edit"
                  ? "Update Review"
                  : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewFormModal;