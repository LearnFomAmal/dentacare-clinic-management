import { useEffect, useState } from "react";
import { X } from "lucide-react";

import Button from "../ui/Button";

const REJECTION_REASONS = [
  {
    label: "Doctor unavailable",
    value: "doctor_unavailable",
  },
  {
    label: "Invalid booking",
    value: "invalid_booking",
  },
  {
    label: "Policy violation",
    value: "policy_violation",
  },
  {
    label: "Duplicate appointment",
    value: "duplicate_appointment",
  },
  {
    label: "Other",
    value: "other",
  },
];

function RejectAppointmentModal({
  open,
  loading = false,
  appointment,
  onClose,
  onConfirm,
}) {
  const [reasonType, setReasonType] = useState("doctor_unavailable");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;

    setReasonType("doctor_unavailable");
    setReason("");
  }, [open]);

  const handleConfirm = () => {
    if (loading) return;

    onConfirm({
      appointmentId: appointment?._id,
      reasonType,
      reason,
    });
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[460px] rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#111827]">
              Reject Appointment
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#6B7280]">
              Give a clear reason. This reason will be visible to the patient.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-[#9CA3AF] transition hover:bg-slate-100 hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={18} />
          </button>
        </div>

        <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
            Appointment
          </p>

          <p className="mt-1 text-sm font-extrabold text-[#111827]">
            {appointment?.appointmentDate || "Date"} ·{" "}
            {appointment?.startTime || ""} - {appointment?.endTime || ""}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {REJECTION_REASONS.map((item) => (
            <label
              key={item.value}
              className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#374151]"
            >
              <input
                type="radio"
                name="reasonType"
                value={item.value}
                checked={reasonType === item.value}
                onChange={(event) => setReasonType(event.target.value)}
                disabled={loading}
                className="h-4 w-4 accent-[#9381FF] disabled:cursor-not-allowed"
              />

              {item.label}
            </label>
          ))}
        </div>

        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          maxLength={300}
          disabled={loading}
          placeholder="Write rejection reason..."
          className="mt-5 w-full resize-none rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10 disabled:cursor-not-allowed disabled:bg-slate-100"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-2xl px-5 text-sm font-extrabold text-[#6B7280] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <Button
            type="button"
            loading={loading}
            disabled={loading}
            onClick={handleConfirm}
            fullWidth={false}
            className="min-w-[150px] bg-red-500 hover:bg-red-600"
          >
            Confirm Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RejectAppointmentModal;