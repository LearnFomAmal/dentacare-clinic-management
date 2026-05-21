import { useEffect } from "react";
import { ArrowLeft, CalendarDays, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PatientLayout from "../../components/patient/PatientLayout";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  fetchDoctorAvailableSlots,
  fetchPublicDoctorDetails,
  setSelectedDate,
  setSelectedDoctorSlot,
} from "../../features/doctor/publicDoctorSlice";

const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
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

function DoctorDetailsPage() {
  const { doctorId } = useParams();
  const dispatch = useAppDispatch();

  const {
    selectedDoctor,
    availableSlotData,
    selectedDate,
    selectedSlotsByDoctor,
    isLoadingDetails,
    isLoadingSlots,
    error,
  } = useAppSelector((state) => state.publicDoctors);

  const selectedSlot = selectedSlotsByDoctor[doctorId];

  useEffect(() => {
    if (doctorId) {
      dispatch(fetchPublicDoctorDetails(doctorId));
    }
  }, [dispatch, doctorId]);

  useEffect(() => {
    if (doctorId) {
      dispatch(
        fetchDoctorAvailableSlots({
          doctorId,
          date: selectedDate || getTodayDateString(),
        })
      );
    }
  }, [dispatch, doctorId, selectedDate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleDateChange = (event) => {
    dispatch(setSelectedDate(event.target.value));
  };

  const handleSlotSelect = (slot) => {
    dispatch(
      setSelectedDoctorSlot({
        doctorId,
        slot,
      })
    );
  };

  const handleContinueBooking = () => {
    if (!selectedSlot) {
      toast.error("Please select a slot first");
      return;
    }

    toast.success(
      "Slot selected. Booking initiate flow will be built in the next task."
    );
  };

  return (
    <PatientLayout>
      <main className="mx-auto max-w-[960px] px-6 py-10">
        <Link
          to={ROUTES.FIND_DOCTORS}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#9381FF]"
        >
          <ArrowLeft size={16} />
          Back to doctors
        </Link>

        {isLoadingDetails ? (
          <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-8 text-sm font-semibold text-[#6B7280]">
            Loading doctor details...
          </div>
        ) : selectedDoctor ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_12px_32px_rgba(17,24,39,0.05)]">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="h-28 w-28 overflow-hidden rounded-3xl bg-[#F0F1FF]">
                  {selectedDoctor.professionalInfo?.profileImage ? (
                    <img
                      src={selectedDoctor.professionalInfo.profileImage}
                      alt={selectedDoctor.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-[#9381FF]">
                      {selectedDoctor.fullName?.charAt(0) || "D"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-extrabold text-[#111827]">
                    Dr.{" "}
                    {selectedDoctor.fullName?.replace(/^Dr\.\s*/i, "")}
                  </h1>

                  <p className="mt-2 text-base font-bold text-[#9381FF]">
                    {selectedDoctor.specialization?.displayName ||
                      selectedDoctor.specialization?.name}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <InfoPill
                      label={`${selectedDoctor.professionalInfo?.experience || 0} years`}
                    />
                    <InfoPill
                      label={`₹${selectedDoctor.professionalInfo?.consultationFee || 0}`}
                    />
                    <InfoPill
                      label={`${selectedDoctor.stats?.averageRating || 0} rating`}
                      icon
                    />
                  </div>

                  <p className="mt-6 text-sm leading-7 text-[#6B7280]">
                    Experienced dental specialist focused on accurate diagnosis,
                    preventive care, and patient-friendly treatment planning.
                  </p>
                </div>
              </div>
            </section>

            <aside className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_12px_32px_rgba(17,24,39,0.05)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
                  <CalendarDays size={21} />
                </div>

                <div>
                  <h2 className="font-extrabold text-[#111827]">
                    Available Slots
                  </h2>

                  <p className="text-sm text-[#6B7280]">
                    Choose a consultation time
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#6B7280]">
                  Appointment Date
                </label>

                <input
                  type="date"
                  value={selectedDate}
                  min={getTodayDateString()}
                  onChange={handleDateChange}
                  className="mt-2 h-12 w-full rounded-xl border border-[#E5E7EB] px-4 text-sm font-semibold outline-none transition focus:border-[#9381FF] focus:ring-2 focus:ring-[#9381FF]/15"
                />
              </div>

              <div className="mt-5">
                {isLoadingSlots ? (
                  <p className="rounded-xl bg-[#F8FAFC] p-4 text-sm font-semibold text-[#6B7280]">
                    Loading slots...
                  </p>
                ) : availableSlotData?.isHoliday ? (
                  <p className="rounded-xl bg-orange-50 p-4 text-sm font-semibold text-orange-600">
                    Sunday holiday. No slots available.
                  </p>
                ) : availableSlotData?.slots?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {availableSlotData.slots.map((slot) => {
                      const active = selectedSlot?._id === slot._id;

                      return (
                        <button
                          key={slot._id}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                            active
                              ? "bg-[#9381FF] text-white"
                              : "bg-[#F8FAFC] text-[#374151] hover:bg-[#F0F1FF] hover:text-[#9381FF]"
                          }`}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[#F8FAFC] p-4 text-sm font-semibold text-[#6B7280]">
                    No slots available for this date.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleContinueBooking}
                className="mt-6 h-12 w-full rounded-xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_12px_24px_rgba(147,129,255,0.25)] transition hover:bg-[#7E6EF2]"
              >
                Continue Booking
              </button>
            </aside>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-8 text-sm font-semibold text-[#6B7280]">
            Doctor not found.
          </div>
        )}
      </main>
    </PatientLayout>
  );
}

function InfoPill({ label, icon = false }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] px-4 py-2 text-sm font-bold text-[#374151]">
      {icon && (
        <Star
          size={14}
          className="text-[#F59E0B]"
          fill="currentColor"
        />
      )}
      {label}
    </span>
  );
}

export default DoctorDetailsPage;