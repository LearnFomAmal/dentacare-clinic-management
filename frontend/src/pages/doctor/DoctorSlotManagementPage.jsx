import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Edit3,
  Plus,
  Save,
  Trash2,
  Umbrella,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  addDoctorSlot,
  applyRecurringSlots,
  deleteDoctorSlot,
  editDoctorSlot,
  fetchDoctorSlots,
  setSelectedDate,
} from "../../features/doctor/doctorSlotSlice";

const RECURRING_OPTIONS = [
  {
    label: "No repeat",
    value: "0",
  },
  {
    label: "Apply to next 1 day",
    value: "1",
  },
  {
    label: "Apply to next 2 days",
    value: "2",
  },
  {
    label: "Apply to next 7 days",
    value: "7",
  },
];

const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
};

const formatDateShort = (dateString) => {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatTime = (time) => {
  if (!time) return "";

  const [hourValue, minute] = time.split(":").map(Number);
  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const getDurationLabel = (startTime, endTime) => {
  if (!startTime || !endTime) return "Invalid";

  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);

  if (duration <= 0) return "Invalid";

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours && minutes) return `${hours}hr ${minutes}min`;
  if (hours) return `${hours}hr`;

  return `${minutes}min`;
};

const isValidSlotTime = (startTime, endTime) => {
  if (!startTime || !endTime) return false;

  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);

  return duration >= 15 && duration <= 120;
};

const getActiveSlots = (slotDay) => {
  return (
    slotDay?.slots?.filter(
      (slot) => !slot.isDeleted && slot.status !== "blocked"
    ) || []
  );
};

function DoctorSlotManagementPage() {
  const dispatch = useAppDispatch();

  const {
    slotDays,
    selectedDate,
    startDate,
    days,
    isLoading,
    isMutating,
    error,
    recurringResult,
  } = useAppSelector((state) => state.doctorSlots);

  const { user } = useAppSelector((state) => state.auth);

  const [recurringDays, setRecurringDays] = useState("0");
  const [slotModal, setSlotModal] = useState({
    open: false,
    mode: "add",
    slot: null,
  });

  const [formValues, setFormValues] = useState({
    startTime: "17:00",
    endTime: "18:00",
  });

  useEffect(() => {
    dispatch(
      fetchDoctorSlots({
        startDate: startDate || getTodayDateString(),
        days,
      })
    );
  }, [dispatch, startDate, days]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (recurringResult) {
      const copiedCount = recurringResult?.copiedDates?.length || 0;
      const skippedCount = recurringResult?.skippedDates?.length || 0;

      toast.success(
        `Recurring applied. Copied: ${copiedCount}, Skipped: ${skippedCount}`
      );

      dispatch(
        fetchDoctorSlots({
          startDate,
          days,
        })
      );
    }
  }, [recurringResult, dispatch, startDate, days]);

  const selectedSlotDay = useMemo(() => {
    return slotDays.find((item) => item.date === selectedDate) || null;
  }, [slotDays, selectedDate]);

  const activeSlots = useMemo(() => {
    return getActiveSlots(selectedSlotDay);
  }, [selectedSlotDay]);

  const openAddModal = () => {
    if (!selectedSlotDay) {
      toast.error("Please select a date first");
      return;
    }

    if (selectedSlotDay.isHoliday) {
      toast.error("Cannot add slots on holiday");
      return;
    }

    setFormValues({
      startTime: "17:00",
      endTime: "18:00",
    });

    setSlotModal({
      open: true,
      mode: "add",
      slot: null,
    });
  };

  const openEditModal = (slot) => {
    setFormValues({
      startTime: slot.startTime,
      endTime: slot.endTime,
    });

    setSlotModal({
      open: true,
      mode: "edit",
      slot,
    });
  };

  const closeSlotModal = () => {
    setSlotModal({
      open: false,
      mode: "add",
      slot: null,
    });

    setFormValues({
      startTime: "17:00",
      endTime: "18:00",
    });
  };

  const handleSlotFormChange = (event) => {
    const { name, value } = event.target;

    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitSlot = async () => {
    if (!selectedSlotDay) {
      toast.error("Please select a date first");
      return;
    }

    if (!isValidSlotTime(formValues.startTime, formValues.endTime)) {
      toast.error("Slot duration must be between 15 minutes and 2 hours");
      return;
    }

    try {
      if (slotModal.mode === "add") {
        const result = await dispatch(
          addDoctorSlot({
            date: selectedSlotDay.date,
            startTime: formValues.startTime,
            endTime: formValues.endTime,
          })
        ).unwrap();

        toast.success(result.message || "Slot added successfully");
      }

      if (slotModal.mode === "edit") {
        const result = await dispatch(
          editDoctorSlot({
            slotDayId: selectedSlotDay._id,
            slotId: slotModal.slot._id,
            startTime: formValues.startTime,
            endTime: formValues.endTime,
          })
        ).unwrap();

        toast.success(result.message || "Slot updated successfully");
      }

      closeSlotModal();
    } catch (err) {
      toast.error(err || "Something went wrong");
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (!selectedSlotDay) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this slot?"
    );

    if (!confirmed) return;

    try {
      const result = await dispatch(
        deleteDoctorSlot({
          slotDayId: selectedSlotDay._id,
          slotId: slot._id,
        })
      ).unwrap();

      toast.success(result.message || "Slot deleted successfully");
    } catch (err) {
      toast.error(err || "Failed to delete slot");
    }
  };

  const handleApplyRecurring = async () => {
    if (!selectedSlotDay) {
      toast.error("Please select a date first");
      return;
    }

    if (selectedSlotDay.isHoliday) {
      toast.error("Cannot apply recurring from a holiday");
      return;
    }

    if (recurringDays === "0") {
      toast.error("Please select recurring option");
      return;
    }

    try {
      await dispatch(
        applyRecurringSlots({
          sourceDate: selectedSlotDay.date,
          repeatDays: Number(recurringDays),
        })
      ).unwrap();

      setRecurringDays("0");
    } catch (err) {
      toast.error(err || "Failed to apply recurring slots");
    }
  };

  return (
    <DashboardLayout title="Manage Consultation Slots">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <DoctorInfoCard user={user} />

          <Link
            to={ROUTES.DOCTOR_SETTINGS}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#7A7A85] shadow-[0_8px_24px_rgba(17,24,39,0.05)] transition hover:text-[#4C59A6] dark:bg-slate-900 dark:text-slate-300"
          >
            <ArrowLeft size={16} />
            Back to Settings
          </Link>
        </div>

        <section className="rounded-[16px] bg-white p-7 shadow-[0_12px_32px_rgba(17,24,39,0.06)] dark:bg-slate-900 dark:shadow-none">
          <div className="mb-7">
            <p className="text-[13px] font-medium text-[#9381FF]">
              Schedule settings
            </p>

            <h1 className="mt-1 text-[28px] font-semibold leading-tight text-black dark:text-slate-100">
              Manage Consultation Slots
            </h1>

            <p className="mt-2 max-w-[680px] text-sm leading-[22px] text-[#7A7A85] dark:text-slate-400">
              Enable or disable consultation timings for each day, keep your
              weekly schedule up to date, and add custom slots whenever needed.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-sm font-medium text-[#595F69] dark:bg-slate-950 dark:text-slate-400">
              Loading consultation slots...
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {slotDays.slice(0, 3).map((slotDay) => (
                  <DayCard
                    key={slotDay._id}
                    slotDay={slotDay}
                    selected={slotDay.date === selectedDate}
                    onClick={() => dispatch(setSelectedDate(slotDay.date))}
                  />
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-slate-100">
                    Available slots for{" "}
                    {selectedSlotDay?.dayOfWeek || "selected day"}
                  </h2>

                  <p className="text-sm text-[#7A7A85] dark:text-slate-400">
                    Default slots stay in place. Only custom slots can be added,
                    edited, or removed.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={recurringDays}
                    onChange={(event) => setRecurringDays(event.target.value)}
                    disabled={selectedSlotDay?.isHoliday || isMutating}
                    className="h-11 rounded-md border border-[#9381FF] bg-white px-4 text-sm font-semibold text-[#9381FF] outline-none transition focus:ring-2 focus:ring-[#9381FF]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900"
                  >
                    {RECURRING_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleApplyRecurring}
                    disabled={
                      isMutating ||
                      recurringDays === "0" ||
                      selectedSlotDay?.isHoliday
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#9381FF] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(147,129,255,0.22)] transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    Save Slots
                  </button>
                </div>
              </div>

              {selectedSlotDay?.isHoliday ? (
                <HolidayState />
              ) : (
                <>
                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {activeSlots.length > 0 ? (
                      activeSlots.map((slot) => (
                        <SlotCard
                          key={slot._id}
                          slot={slot}
                          onEdit={() => openEditModal(slot)}
                          onDelete={() => handleDeleteSlot(slot)}
                          disabled={isMutating}
                        />
                      ))
                    ) : (
                      <EmptySlotState />
                    )}
                  </div>

                  <div className="mt-7 flex flex-col items-center gap-4">
                    <button
                      type="button"
                      onClick={openAddModal}
                      disabled={isMutating}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#9381FF] transition hover:text-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus size={18} />
                      Add New Slot
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>

      {slotModal.open && (
        <SlotModal
          mode={slotModal.mode}
          values={formValues}
          loading={isMutating}
          onChange={handleSlotFormChange}
          onClose={closeSlotModal}
          onSubmit={handleSubmitSlot}
        />
      )}
    </DashboardLayout>
  );
}

function DoctorInfoCard({ user }) {
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Doctor";

  return (
    <div className="flex min-w-[320px] items-center gap-4 rounded-xl bg-white px-5 py-[18px] shadow-[0_8px_24px_rgba(17,24,39,0.06)] dark:bg-slate-900 dark:shadow-none">
      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#F0F1FF] text-[#9381FF]">
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt={fullName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-lg font-bold">
            {fullName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-black dark:text-slate-100">
          Dr. {fullName.replace(/^Dr\.\s*/i, "")}
        </h2>

        <p className="text-sm text-[#7A7A85] dark:text-slate-400">
          Consultation Slot Manager
        </p>
      </div>
    </div>
  );
}

function DayCard({ slotDay, selected, onClick }) {
  const activeSlots = getActiveSlots(slotDay);

  if (slotDay.isHoliday) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[96px] flex-col justify-center rounded-xl bg-gradient-to-b from-[#FFF4E5] to-white px-[18px] py-5 text-left transition hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black">
            {slotDay.dayOfWeek?.slice(0, 3)}
          </h3>

          <Umbrella size={20} className="text-[#663C00]" />
        </div>

        <span className="mt-3 inline-flex w-fit rounded-full bg-[#FFF4E5] px-3 py-1 text-xs font-medium text-[#663C00]">
          Holiday
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[96px] flex-col justify-center rounded-xl px-[18px] py-5 text-left transition ${
        selected
          ? "bg-[#9381FF] text-white shadow-[0_12px_24px_rgba(147,129,255,0.22)]"
          : "bg-[#F6F6FB] text-black hover:shadow-md dark:bg-slate-950 dark:text-slate-100"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {slotDay.dayOfWeek?.slice(0, 3)}
        </h3>

        <CalendarDays
          size={20}
          className={selected ? "text-white" : "text-[#7A7A85]"}
        />
      </div>

      <p
        className={`mt-2 text-[13px] ${
          selected ? "text-white/90" : "text-black/80 dark:text-slate-400"
        }`}
      >
        {formatDateShort(slotDay.date)} ·{" "}
        {selected ? "Active day · " : ""}
        {activeSlots.length} slots
      </p>
    </button>
  );
}

function SlotCard({ slot, onEdit, onDelete, disabled }) {
  return (
    <div className="min-h-[136px] rounded-[14px] border border-black/10 bg-white p-[18px] dark:border-slate-800 dark:bg-slate-950">
      <h3 className="text-base font-semibold text-black dark:text-slate-100">
        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
      </h3>

      <div className="mt-4 flex items-center gap-2">
        <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-medium tracking-[-0.5px] text-[#15803D]">
          Duration:{getDurationLabel(slot.startTime, slot.endTime)}
        </span>

        {slot.type === "extra" && (
          <span className="inline-flex rounded-full bg-[#F0F1FF] px-3 py-1 text-xs font-medium text-[#7C5CFC]">
            Extra
          </span>
        )}

        {slot.status === "booked" && (
          <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
            Booked
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center gap-[18px]">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled || slot.status === "booked"}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#7C5CFC] transition hover:text-[#5F43E8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Edit3 size={16} />
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={disabled || slot.status === "booked"}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#EF4444] transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}

function SlotModal({
  mode,
  values,
  loading,
  onChange,
  onClose,
  onSubmit,
}) {
  const durationLabel = getDurationLabel(values.startTime, values.endTime);
  const valid = isValidSlotTime(values.startTime, values.endTime);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[430px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-black dark:text-slate-100">
              {mode === "add" ? "Add Slot" : "Edit Slot"}
            </h2>

            <p className="text-sm text-[#7A7A85] dark:text-slate-400">
              Set your consultation time
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#7A7A85] transition hover:bg-slate-100 hover:text-black dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#7A7A85]">
              Start Time
            </span>

            <div className="relative">
              <input
                type="time"
                name="startTime"
                value={values.startTime}
                onChange={onChange}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-black outline-none transition focus:border-[#9381FF] focus:ring-2 focus:ring-[#9381FF]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />

              <Clock
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A85]"
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.6px] text-[#7A7A85]">
              End Time
            </span>

            <div className="relative">
              <input
                type="time"
                name="endTime"
                value={values.endTime}
                onChange={onChange}
                className={`h-11 w-full rounded-lg border bg-white px-3 pr-9 text-sm font-medium text-black outline-none transition focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
                  valid
                    ? "border-slate-200 focus:border-[#9381FF] focus:ring-[#9381FF]/20 dark:border-slate-700"
                    : "border-red-400 focus:border-red-400 focus:ring-red-200"
                }`}
              />

              <Clock
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A7A85]"
              />
            </div>

            {!valid && (
              <p className="text-xs font-medium text-red-500">
                End time must be after start time
              </p>
            )}
          </label>
        </div>

        <div className="mt-5 rounded-lg bg-[#F3EFFF] px-4 py-3 text-sm font-semibold text-[#7C5CFC]">
          Total Slot Duration: {durationLabel}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-[#7A7A85] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
          >
            Cancel
          </button>

          <Button
            type="button"
            loading={loading}
            disabled={!valid || loading}
            onClick={onSubmit}
            fullWidth={false}
            className="min-w-[120px]"
          >
            {mode === "add" ? "Add Slot" : "Edit Slot"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HolidayState() {
  return (
    <div className="mt-6 rounded-2xl border border-orange-100 bg-gradient-to-b from-[#FFF4E5] to-white p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4E5] text-[#663C00]">
        <Umbrella size={26} />
      </div>

      <h3 className="mt-4 text-lg font-bold text-black">
        Sunday Holiday
      </h3>

      <p className="mt-2 text-sm text-[#7A7A85]">
        Consultation slots are not available on Sundays.
      </p>
    </div>
  );
}

function EmptySlotState() {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-[#F8FAFC] p-8 text-center dark:border-slate-700 dark:bg-slate-950">
      <h3 className="text-base font-bold text-black dark:text-slate-100">
        No active slots available
      </h3>

      <p className="mt-2 text-sm text-[#7A7A85] dark:text-slate-400">
        Add a new consultation slot for this date.
      </p>
    </div>
  );
}

export default DoctorSlotManagementPage;