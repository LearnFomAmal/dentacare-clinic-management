import { useEffect, useState } from "react";
import { X } from "lucide-react";

import Button from "../ui/Button";
import { getCancellationRefundInfo } from "../../utils/appointmentUi";

const CANCELLATION_REASONS = [
  {
    label: "Personal reason",
    value: "personal_reason",
  },
  {
    label: "Medical emergency",
    value: "medical_emergency",
  },
  {
    label: "Doctor unavailable",
    value: "doctor_unavailable",
  },
  {
    label: "Schedule conflict",
    value: "schedule_conflict",
  },
  {
    label: "Wrong booking",
    value: "wrong_booking",
  },
  {
    label: "Other",
    value: "other",
  },
];

function CancelAppointmentModal({
  open,
  loading = false,
  appointment,
  actor = "patient",
  onClose,
  onConfirm,
}) {
  const [reasonType, setReasonType] = useState("personal_reason");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;

    if (actor === "doctor") {
      setReasonType("doctor_unavailable");
    } else {
      setReasonType("personal_reason");
    }

    setReason("");
  }, [open, actor]);

  if (!open) return null;
   const refundInfo = getCancellationRefundInfo(appointment);
  const handleConfirm = () => {
    onConfirm({
      appointmentId: appointment?._id,
      reasonType,
      reason,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[470px] rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#111827]">
              Cancel Appointment
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#6B7280]">
  Give a clear cancellation reason. Refund depends on the cancellation
  cutoff policy.
</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-[#9CA3AF] transition hover:bg-slate-100 hover:text-[#111827]"
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
         {refundInfo.isPaid && (
  <div
    className={`mt-4 rounded-2xl border p-4 ${
      actor === "doctor" || actor === "admin" || refundInfo.refundEligible
        ? "border-green-100 bg-green-50 text-green-700"
        : "border-red-100 bg-red-50 text-red-700"
    }`}
  >
    <p className="text-xs font-extrabold uppercase tracking-[0.6px]">
      {actor === "doctor" || actor === "admin" || refundInfo.refundEligible
        ? "Refund Eligible"
        : "No Refund"}
    </p>

    <p className="mt-2 text-sm font-semibold leading-6">
      {actor === "doctor"
        ? "Because the doctor is cancelling this appointment, the patient will receive a refund to wallet."
        : actor === "admin"
          ? "Because admin is cancelling this appointment, the patient will receive a refund to wallet."
          : refundInfo.message}
    </p>
  </div>
)}
        <div className="mt-5 space-y-3">
          {CANCELLATION_REASONS.map((item) => (
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
                className="h-4 w-4 accent-[#9381FF]"
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
          placeholder="Write cancellation reason..."
          className="mt-5 w-full resize-none rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-2xl px-5 text-sm font-extrabold text-[#6B7280] transition hover:bg-slate-100"
          >
            Close
          </button>

          <Button
            type="button"
            loading={loading}
            disabled={loading}
            onClick={handleConfirm}
            fullWidth={false}
            className="min-w-[160px] bg-red-500 text-white hover:bg-red-600"
          >
            Confirm Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CancelAppointmentModal;