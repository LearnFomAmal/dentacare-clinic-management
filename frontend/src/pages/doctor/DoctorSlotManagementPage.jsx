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

import ConfirmModal from "../../components/ui/ConfirmModal";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  addDoctorSlot,
  applyRecurringSlots,
  clearDoctorSlotError,
  clearRecurringResult,
  deleteDoctorSlot,
  editDoctorSlot,
  fetchDoctorSlots,
  markSlotDayHoliday,
  restoreDefaultSlots,
  setSelectedDate,
  undoSlotDayHoliday,
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
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const isSundaySlotDay = (slotDay) => {
  return slotDay?.dayOfWeek === "Sunday";
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

const hasBookedSlot = (slotDay) => {
  return Boolean(
    slotDay?.slots?.some(
      (slot) => !slot.isDeleted && slot.status === "booked"
    )
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
    recurringResult,
  } = useAppSelector((state) => state.doctorSlots);

  const { user } = useAppSelector((state) => state.auth);

  const [recurringDays, setRecurringDays] = useState("0");

  const [slotModal, setSlotModal] = useState({
    open: false,
    mode: "add",
    slot: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    slot: null,
  });

  const [holidayModal, setHolidayModal] = useState({
    open: false,
    mode: null,
  });

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

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
    )
      .unwrap()
      .catch((err) => {
        toast.error(err || "Failed to fetch doctor slots");
        dispatch(clearDoctorSlotError());
      });
  }, [dispatch, startDate, days]);

  useEffect(() => {
    if (!recurringResult) return;

    const copiedCount = recurringResult?.copiedDates?.length || 0;
    const skippedCount = recurringResult?.skippedDates?.length || 0;

    toast.success(
      `Recurring applied. Copied: ${copiedCount}, Skipped: ${skippedCount}`
    );

    dispatch(clearRecurringResult());

    dispatch(
      fetchDoctorSlots({
        startDate,
        days,
      })
    );
  }, [recurringResult, dispatch, startDate, days]);

  const selectedSlotDay = useMemo(() => {
    return slotDays.find((item) => item.date === selectedDate) || null;
  }, [slotDays, selectedDate]);

  const activeSlots = useMemo(() => {
    return getActiveSlots(selectedSlotDay);
  }, [selectedSlotDay]);

  const selectedDayHasBookedSlot = hasBookedSlot(selectedSlotDay);

const canRestoreDefaults = Boolean(
  selectedSlotDay &&
    !isSundaySlotDay(selectedSlotDay) &&
    !selectedDayHasBookedSlot
);

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
      dispatch(clearDoctorSlotError());
    } catch (err) {
      toast.error(err || "Something went wrong");
      dispatch(clearDoctorSlotError());
    }
  };

const handleDeleteSlot = (slot) => {
  if (!selectedSlotDay) return;

  setDeleteModal({
    open: true,
    slot,
  });
};

  const confirmDeleteSlot = async () => {
    if (!selectedSlotDay || !deleteModal.slot) return;

    try {
      const result = await dispatch(
        deleteDoctorSlot({
          slotDayId: selectedSlotDay._id,
          slotId: deleteModal.slot._id,
        })
      ).unwrap();

      toast.success(result.message || "Slot deleted successfully");

      setDeleteModal({
        open: false,
        slot: null,
      });

      dispatch(clearDoctorSlotError());
    } catch (err) {
      toast.error(err || "Failed to delete slot");
      dispatch(clearDoctorSlotError());
    }
  };

  const openHolidayModal = (mode) => {
    if (!selectedSlotDay) {
      toast.error("Please select a date first");
      return;
    }

    if (isSundaySlotDay(selectedSlotDay)) {
      toast.error("Sunday is already a fixed holiday");
      return;
    }

    if (mode === "mark" && selectedDayHasBookedSlot) {
      toast.error("Cannot mark holiday because this date has booked slots");
      return;
    }

    setHolidayModal({
      open: true,
      mode,
    });
  };

  const closeHolidayModal = () => {
    setHolidayModal({
      open: false,
      mode: null,
    });
  };

  const confirmHolidayAction = async () => {
    if (!selectedSlotDay || !holidayModal.mode) return;

    try {
      if (holidayModal.mode === "mark") {
        const result = await dispatch(
          markSlotDayHoliday(selectedSlotDay._id)
        ).unwrap();

        toast.success(result.message || "Date marked as holiday");
      }

      if (holidayModal.mode === "undo") {
        const result = await dispatch(
          undoSlotDayHoliday(selectedSlotDay._id)
        ).unwrap();

        toast.success(result.message || "Holiday removed");
      }

      closeHolidayModal();
      dispatch(clearDoctorSlotError());
    } catch (err) {
      toast.error(err || "Holiday action failed");
      dispatch(clearDoctorSlotError());
    }
  };

  const confirmRestoreDefaults = async () => {
    if (!selectedSlotDay) return;

    try {
      const result = await dispatch(
        restoreDefaultSlots(selectedSlotDay._id)
      ).unwrap();

      toast.success(result.message || "Default slots restored");
      setRestoreModalOpen(false);
      dispatch(clearDoctorSlotError());
    } catch (err) {
      toast.error(err || "Failed to restore default slots");
      dispatch(clearDoctorSlotError());
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
      dispatch(clearDoctorSlotError());
    } catch (err) {
      toast.error(err || "Failed to apply recurring slots");
      dispatch(clearDoctorSlotError());
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

        <section className="rounded-[22px] bg-white p-7 shadow-[0_12px_32px_rgba(17,24,39,0.06)] dark:bg-slate-900 dark:shadow-none">
          <div className="mb-7">
            <p className="text-[13px] font-bold text-[#9381FF]">
              Schedule settings
            </p>

            <h1 className="mt-1 text-[28px] font-extrabold leading-tight text-black dark:text-slate-100">
              Manage Consultation Slots
            </h1>

            <p className="mt-2 max-w-[760px] text-sm leading-[22px] text-[#7A7A85] dark:text-slate-400">
              Manage working days, extra consultation timings, recurring slots,
              and holiday availability. Default slots are protected from direct
              deletion.
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-sm font-medium text-[#595F69] dark:bg-slate-950 dark:text-slate-400">
              Loading consultation slots...
            </div>
          ) : (
            <>
              <div className="-mx-1 overflow-x-auto pb-3">
                <div className="flex min-w-max gap-4 px-1">
                  {slotDays.map((slotDay) => (
                    <DayCard
                      key={slotDay._id}
                      slotDay={slotDay}
                      selected={slotDay.date === selectedDate}
                      onClick={() => dispatch(setSelectedDate(slotDay.date))}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-black dark:text-slate-100">
                    Available slots for{" "}
                    {selectedSlotDay?.dayOfWeek || "selected day"}
                  </h2>

                  <p className="mt-1 max-w-[680px] text-sm leading-6 text-[#7A7A85] dark:text-slate-400">
                    Default slots are system-generated. You can add, edit, or
                    remove only extra slots. Use holiday mode when the doctor is
                    unavailable for the full day.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end xl:justify-end">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#7A7A85]">
                      Repeat slots
                    </span>

                    <select
                      value={recurringDays}
                      onChange={(event) =>
                        setRecurringDays(event.target.value)
                      }
                      disabled={selectedSlotDay?.isHoliday || isMutating}
                      className="h-11 min-w-[210px] rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#4B5563] outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    >
                      {RECURRING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyRecurring}
                    disabled={
                      isMutating ||
                      recurringDays === "0" ||
                      selectedSlotDay?.isHoliday
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#9381FF] px-5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(147,129,255,0.22)] transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    Save Slots
                  </button>

                  {selectedSlotDay?.isHoliday ? (
                    <button
                      type="button"
                      onClick={() => openHolidayModal("undo")}
                      disabled={isMutating || isSundaySlotDay(selectedSlotDay)}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-5 text-sm font-bold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Umbrella size={16} />
                      Undo Holiday
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openHolidayModal("mark")}
                      disabled={
                        isMutating ||
                        isSundaySlotDay(selectedSlotDay) ||
                        selectedDayHasBookedSlot
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-5 text-sm font-bold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Umbrella size={16} />
                      Mark Holiday
                    </button>
                  )}
                </div>
              </div>

              {selectedSlotDay?.isHoliday ? (
               <HolidayState
  slotDay={selectedSlotDay}
  canRestore={canRestoreDefaults}
  loading={isMutating}
  onRestore={() => setRestoreModalOpen(true)}
/>
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
                      <EmptySlotState
                        canRestore={canRestoreDefaults}
                        loading={isMutating}
                        onRestore={() => setRestoreModalOpen(true)}
                      />
                    )}
                  </div>

                  <div className="mt-7 flex flex-col items-center gap-4">
                    <button
                      type="button"
                      onClick={openAddModal}
                      disabled={isMutating}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-[#9381FF] transition hover:bg-[#F3EFFF] hover:text-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
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

  <ConfirmModal
  open={deleteModal.open}
  title="Delete Slot?"
  description={
    deleteModal.slot?.type === "default"
      ? "Are you sure you want to delete this default slot? If this is the last active slot, this date will become unavailable for patients."
      : "Are you sure you want to delete this extra slot? If this is the last active slot, this date will become unavailable for patients."
  }
  confirmText="Delete Slot"
  cancelText="Cancel"
  danger
  loading={isMutating}
  onConfirm={confirmDeleteSlot}
  onCancel={() =>
    setDeleteModal({
      open: false,
      slot: null,
    })
  }
/>

      <ConfirmModal
        open={holidayModal.open}
        title={
          holidayModal.mode === "mark"
            ? "Mark Date as Holiday?"
            : "Undo Holiday?"
        }
        description={
          holidayModal.mode === "mark"
            ? "Patients will not be able to book appointments on this date. This is only allowed when there are no booked slots."
            : "Default consultation slots will be restored for this date."
        }
        confirmText={
          holidayModal.mode === "mark" ? "Mark Holiday" : "Undo Holiday"
        }
        cancelText="Cancel"
        danger={holidayModal.mode === "mark"}
        loading={isMutating}
        onConfirm={confirmHolidayAction}
        onCancel={closeHolidayModal}
      />

      <ConfirmModal
        open={restoreModalOpen}
        title="Restore Default Slots?"
        description="This will recreate the clinic's standard consultation slots for this date. Use this when slots were accidentally removed."
        confirmText="Restore Slots"
        cancelText="Cancel"
        loading={isMutating}
        onConfirm={confirmRestoreDefaults}
        onCancel={() => setRestoreModalOpen(false)}
      />
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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[112px] w-[190px] shrink-0 rounded-2xl border px-5 py-4 text-left transition ${
        selected
          ? "border-[#9381FF] bg-[#9381FF] text-white shadow-[0_16px_34px_rgba(147,129,255,0.26)]"
          : slotDay.isHoliday
            ? "border-orange-100 bg-orange-50 text-[#111827] hover:border-orange-200 hover:shadow-md"
            : "border-[#EEF0F6] bg-[#F8FAFC] text-[#111827] hover:border-[#DAD7FF] hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold">
            {slotDay.dayOfWeek?.slice(0, 3)}
          </h3>

          <p
            className={`mt-1 text-sm font-semibold ${
              selected ? "text-white/85" : "text-[#6B7280]"
            }`}
          >
            {formatDateShort(slotDay.date)}
          </p>
        </div>

        {slotDay.isHoliday ? (
          <Umbrella
            size={20}
            className={selected ? "text-white" : "text-orange-600"}
          />
        ) : (
          <CalendarDays
            size={20}
            className={selected ? "text-white" : "text-[#9381FF]"}
          />
        )}
      </div>

      <div className="mt-4">
        {slotDay.isHoliday ? (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              selected
                ? "bg-white/20 text-white"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            Holiday
          </span>
        ) : (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              selected
                ? "bg-white/20 text-white"
                : "bg-[#F0F1FF] text-[#9381FF]"
            }`}
          >
            {activeSlots.length} slots
          </span>
        )}
      </div>
    </button>
  );
}

function SlotCard({ slot, onEdit, onDelete, disabled }) {
  const isDefaultSlot = slot.type === "default";
  const isBooked = slot.status === "booked";
  
  return (
    <div className="min-h-[148px] rounded-2xl border border-[#EEF0F6] bg-white p-5 shadow-[0_10px_26px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-extrabold text-black dark:text-slate-100">
            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
          </h3>

          <p className="mt-1 text-xs font-semibold text-[#7A7A85]">
            Duration: {getDurationLabel(slot.startTime, slot.endTime)}
          </p>
        </div>

        {isBooked && (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
            Booked
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isDefaultSlot ? (
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            Default
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-[#F0F1FF] px-3 py-1 text-xs font-bold text-[#7C5CFC]">
            Extra
          </span>
        )}

        {!isBooked && (
          <span className="inline-flex rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#15803D]">
            Available
          </span>
        )}
      </div>

      <div className="mt-6 flex items-center gap-[18px]">
        <button
          type="button"
          onClick={onEdit}
          disabled={disabled || isBooked}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#7C5CFC] transition hover:text-[#5F43E8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Edit3 size={16} />
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={disabled || isBooked}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#EF4444] transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}

function SlotModal({ mode, values, loading, onChange, onClose, onSubmit }) {
  const durationLabel = getDurationLabel(values.startTime, values.endTime);
  const valid = isValidSlotTime(values.startTime, values.endTime);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[430px] rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:bg-slate-900">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-black dark:text-slate-100">
              {mode === "add" ? "Add2 Extra Slot" : "Edit Slot"}
            </h2>

            <p className="text-sm text-[#7A7A85] dark:text-slate-400">
              Set your consultation time.
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
                Slot duration must be between 15 minutes and 2 hours.
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
            {mode === "add" ? "Add Slot" : "Save Slot"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HolidayState({
  slotDay,
  canRestore = false,
  loading = false,
  onRestore,
}) {
  const isSunday = slotDay?.dayOfWeek === "Sunday";

  return (
    <div className="mt-6 rounded-2xl border border-orange-100 bg-gradient-to-b from-[#FFF4E5] to-white p-8 text-center dark:border-orange-900/40 dark:from-orange-950/30 dark:to-slate-950">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF4E5] text-[#663C00] dark:bg-orange-900/40 dark:text-orange-300">
        <Umbrella size={26} />
      </div>

      <h3 className="mt-4 text-lg font-bold text-black dark:text-slate-100">
        {isSunday ? "Sunday Holiday" : "Doctor Unavailable"}
      </h3>

      <p className="mx-auto mt-2 max-w-[460px] text-sm leading-6 text-[#7A7A85] dark:text-slate-400">
        {isSunday
          ? "Consultation slots are not available on Sundays."
          : "This date has no active consultation slots. Patients cannot book appointments on this date."}
      </p>

      {canRestore && (
        <button
          type="button"
          onClick={onRestore}
          disabled={loading}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#9381FF] px-5 text-sm font-bold text-white transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Restore Default Slots
        </button>
      )}
    </div>
  );
}

function EmptySlotState({ canRestore, loading, onRestore }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-[#F8FAFC] p-8 text-center dark:border-slate-700 dark:bg-slate-950">
      <h3 className="text-base font-bold text-black dark:text-slate-100">
        No active slots available
      </h3>

      <p className="mt-2 text-sm text-[#7A7A85] dark:text-slate-400">
        This date has no active consultation slots.
      </p>

      {canRestore && (
        <button
          type="button"
          onClick={onRestore}
          disabled={loading}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#9381FF] px-5 text-sm font-bold text-white transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Restore Default Slots
        </button>
      )}
    </div>
  );
}

export default DoctorSlotManagementPage;