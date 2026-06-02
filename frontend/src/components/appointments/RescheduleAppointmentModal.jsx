import { useEffect, useMemo, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../ui/Button";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearPublicDoctorError,
  fetchDoctorAvailableSlots,
  setSelectedDate,
} from "../../features/doctor/publicDoctorSlice";
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from "../../utils/appointmentUi";
import { getLocalDateString } from "../../utils/dateUtils";

const RESCHEDULE_REASONS = [
  {
    label: "Personal reason",
    value: "personal_reason",
  },
  {
    label: "Medical emergency",
    value: "medical_emergency",
  },
  {
    label: "Schedule conflict",
    value: "schedule_conflict",
  },
  {
    label: "Doctor requested",
    value: "doctor_requested",
  },
  {
    label: "Other",
    value: "other",
  },
];

function RescheduleAppointmentModal({
  open,
  loading = false,
  appointment,
  onClose,
  onConfirm,
}) {
  const dispatch = useAppDispatch();

  const {
    selectedDate,
    availableSlotData,
    isLoadingSlots,
    error,
  } = useAppSelector((state) => state.publicDoctors);

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reasonType, setReasonType] = useState("schedule_conflict");
  const [reason, setReason] = useState("");

  const doctorId =
    appointment?.doctorId && typeof appointment.doctorId === "object"
      ? appointment.doctorId._id
      : appointment?.doctorId;

  useEffect(() => {
    if (!open) return;

    dispatch(setSelectedDate(getLocalDateString()));
    setSelectedSlot(null);
    setReasonType("schedule_conflict");
    setReason("");
  }, [open, dispatch]);

  useEffect(() => {
    if (!open || !doctorId || !selectedDate) return;

    dispatch(
      fetchDoctorAvailableSlots({
        doctorId,
        date: selectedDate,
      })
    );
  }, [open, doctorId, selectedDate, dispatch]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearPublicDoctorError());
  }, [error, dispatch]);

  const slots = useMemo(() => {
    return (availableSlotData?.slots || []).filter((slot) => {
      const currentSlotId = appointment?.slotId?.toString?.() || appointment?.slotId;

      return (
        slot.status === "available" &&
        !slot.isDeleted &&
        String(slot._id) !== String(currentSlotId)
      );
    });
  }, [availableSlotData, appointment]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!selectedSlot) {
      toast.error("Select a new slot");
      return;
    }

    if (!reason.trim()) {
      toast.error("Reschedule reason is required");
      return;
    }

    onConfirm({
      newSlotDayId:
        selectedSlot.slotDayId ||
        availableSlotData?.slotDayId ||
        availableSlotData?._id,
      newSlotId: selectedSlot._id,
      newAppointmentDate: selectedDate,
      reasonType,
      reason,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#111827]">
              Reschedule Appointment
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#6B7280]">
              Select a new available slot. Rescheduled appointments go back to
              pending approval.
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
            Current appointment
          </p>

          <p className="mt-1 text-sm font-extrabold text-[#111827]">
            {formatAppointmentDate(appointment?.appointmentDate)} ·{" "}
            {formatAppointmentTime(appointment?.startTime)} -{" "}
            {formatAppointmentTime(appointment?.endTime)}
          </p>
        </div>

        <section className="mt-5">
          <label className="text-sm font-extrabold text-[#111827]">
            New date
          </label>

          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-[#E5E7EB] px-4 py-3">
            <CalendarDays size={18} className="text-[#9381FF]" />

            <input
              type="date"
              value={selectedDate}
              min={getLocalDateString()}
              onChange={(event) => {
                dispatch(setSelectedDate(event.target.value));
                setSelectedSlot(null);
              }}
              className="w-full bg-transparent text-sm font-bold text-[#111827] outline-none"
            />
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-extrabold text-[#111827]">
            Available slots
          </h3>

          {isLoadingSlots ? (
            <p className="mt-3 rounded-2xl bg-[#F8FAFC] p-5 text-sm font-bold text-[#6B7280]">
              Loading slots...
            </p>
          ) : slots.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-5 text-center text-sm font-bold text-[#6B7280]">
              No available slots for this date.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {slots.map((slot) => (
                <button
                  key={slot._id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedSlot?._id === slot._id
                      ? "border-[#9381FF] bg-[#F8F7FF]"
                      : "border-[#EEF0F6] bg-white hover:border-[#B8B8FF]"
                  }`}
                >
                  <p className="text-sm font-extrabold text-[#111827]">
                    {formatAppointmentTime(slot.startTime)} -{" "}
                    {formatAppointmentTime(slot.endTime)}
                  </p>

                  <p className="mt-1 text-xs font-bold capitalize text-[#6B7280]">
                    {slot.type || "slot"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-extrabold text-[#111827]">
            Reason
          </h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {RESCHEDULE_REASONS.map((item) => (
              <label
                key={item.value}
                className="flex cursor-pointer items-center gap-3 text-sm font-bold text-[#374151]"
              >
                <input
                  type="radio"
                  name="rescheduleReason"
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
            placeholder="Write reschedule reason..."
            className="mt-4 w-full resize-none rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm font-medium outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
          />
        </section>

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
            className="min-w-[170px]"
          >
            Confirm Reschedule
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RescheduleAppointmentModal;