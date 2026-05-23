import { useEffect, useMemo } from "react";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  IndianRupee,
  Phone,
  Star,
  Stethoscope,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PatientLayout from "../../components/patient/PatientLayout";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearPublicDoctorError,
  fetchDoctorAvailableSlots,
  fetchPublicDoctorDetails,
  setSelectedDate,
  setSelectedDoctorSlot,
} from "../../features/doctor/publicDoctorSlice";

const getTodayDateString = () => {
  return new Date().toISOString().split("T")[0];
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const getNextSevenDays = () => {
  const today = getTodayDateString();

  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index);
    const dateObject = new Date(`${date}T00:00:00`);

    return {
      date,
      label: index === 0 ? "Today" : dateObject.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      day: dateObject.toLocaleDateString("en-US", {
        day: "2-digit",
      }),
      month: dateObject.toLocaleDateString("en-US", {
        month: "short",
      }),
    };
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

function DoctorDetailsPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
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

  const days = useMemo(() => getNextSevenDays(), []);

  const sortedSlots = useMemo(() => {
    const slots = availableSlotData?.slots || [];

    return [...slots].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
  }, [availableSlotData]);

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
  if (!error) return;

  toast.error(error);
  dispatch(clearPublicDoctorError());
}, [error, dispatch]);

  const handleDateSelect = (date) => {
    dispatch(setSelectedDate(date));
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

  navigate(`/book-appointment/${doctorId}`);
};

  return (
    <PatientLayout>
      <main className="mx-auto max-w-[960px] px-6 py-10">
        <Link
          to={ROUTES.FIND_DOCTORS}
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#9381FF]"
        >
          <ArrowLeft size={17} />
          Back to doctors
        </Link>

        {isLoadingDetails ? (
          <div className="mt-6 rounded-3xl bg-[#F8FAFC] p-10 text-sm font-bold text-[#6B7280]">
            Loading doctor details...
          </div>
        ) : selectedDoctor ? (
          <div className="mt-6 space-y-8">
            <DoctorProfileCard doctor={selectedDoctor} />

            <section>
              <h2 className="text-2xl font-extrabold tracking-[-0.5px] text-[#111827]">
                Select Available Slot
              </h2>

              <p className="mt-2 text-sm text-[#6B7280]">
                Choose a date first, then select a consultation time.
              </p>

              <div className="mt-5 flex gap-4 overflow-x-auto pb-3">
                {days.map((item) => (
                  <DateCard
                    key={item.date}
                    item={item}
                    active={selectedDate === item.date}
                    onClick={() => handleDateSelect(item.date)}
                  />
                ))}
              </div>

              <div className="mt-6">
                {isLoadingSlots ? (
                  <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280]">
                    Loading available slots...
                  </div>
                ) : availableSlotData?.isHoliday ? (
                  <div className="rounded-2xl bg-orange-50 p-6 text-sm font-bold text-orange-600">
                    Sunday holiday. No slots available.
                  </div>
                ) : sortedSlots.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {sortedSlots.map((slot) => {
                      const active = selectedSlot?._id === slot._id;

                      return (
                        <button
                          key={slot._id}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`h-16 rounded-2xl border text-sm font-extrabold transition ${
                            active
                              ? "border-green-200 bg-green-100 text-green-700 shadow-[0_12px_26px_rgba(34,197,94,0.16)]"
                              : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9381FF] hover:bg-[#F0F1FF] hover:text-[#9381FF]"
                          }`}
                        >
                          {formatTime(slot.startTime)} –{" "}
                          {formatTime(slot.endTime)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-8 text-center">
                    <h3 className="font-extrabold text-[#111827]">
                      No slots available
                    </h3>

                    <p className="mt-2 text-sm text-[#6B7280]">
                      Try selecting another date.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleContinueBooking}
                  className="h-13 min-w-[220px] rounded-2xl bg-[#9381FF] px-8 py-4 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2]"
                >
                  Continue Booking
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl bg-[#F8FAFC] p-10 text-sm font-bold text-[#6B7280]">
            Doctor not found.
          </div>
        )}
      </main>
    </PatientLayout>
  );
}

function DoctorProfileCard({ doctor }) {
  const fullName = doctor.fullName || "Doctor";
  const specialty =
    doctor.specialization?.displayName ||
    doctor.specialization?.name ||
    "Dental Specialist";

  return (
    <section className="rounded-3xl border border-[#EEF0F6] bg-white p-8 shadow-[0_18px_48px_rgba(17,24,39,0.06)]">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-[#F0F1FF]">
            {doctor.professionalInfo?.profileImage ? (
              <img
                src={doctor.professionalInfo.profileImage}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-[#9381FF]">
                {fullName.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-extrabold tracking-[-0.8px] text-[#111827]">
              Dr. {fullName.replace(/^Dr\.\s*/i, "")}
            </h1>

            <p className="mt-2 flex items-center gap-2 text-base font-bold text-[#9381FF]">
              <Stethoscope size={18} />
              {specialty}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <ProfilePill
                icon={BriefcaseBusiness}
                text={`${doctor.professionalInfo?.experience || 0} Years Experience`}
              />

              <ProfilePill
                icon={Phone}
                text={`No:${doctor.professionalInfo?.contactNumber || "Not available"}`}
              />

              <ProfilePill
                icon={Star}
                text={`${doctor.stats?.averageRating || 0} Rating`}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F3EFFF] px-6 py-4 text-[#9381FF]">
          <p className="text-sm font-bold">Fee</p>
          <p className="mt-1 flex items-center text-2xl font-extrabold">
            <IndianRupee size={22} />
            {doctor.professionalInfo?.consultationFee || 0}
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfilePill({ icon: Icon, text }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-4 py-2 text-sm font-bold text-[#6B7280]">
      <Icon size={16} className="text-[#9381FF]" />
      {text}
    </span>
  );
}

function DateCard({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-[170px] rounded-2xl border px-7 py-6 text-center transition ${
        active
          ? "border-[#9381FF] bg-[#9381FF] text-white shadow-[0_18px_34px_rgba(147,129,255,0.28)]"
          : "border-[#E5E7EB] bg-white text-[#111827] hover:border-[#9381FF] hover:bg-[#F8F7FF]"
      }`}
    >
      <p
        className={`text-lg font-extrabold ${
          active ? "text-white" : "text-[#9CA3AF]"
        }`}
      >
        {item.label}
      </p>

      {item.label !== "Today" && (
        <>
          <p className="mt-2 text-4xl font-extrabold leading-none">
            {item.day}
          </p>

          <p
            className={`mt-1 text-base font-bold ${
              active ? "text-white/80" : "text-[#9CA3AF]"
            }`}
          >
            {item.month}
          </p>
        </>
      )}

      {item.label === "Today" && (
        <p className="mt-3 text-sm font-bold text-white/90">
          Available today
        </p>
      )}
    </button>
  );
}

export default DoctorDetailsPage;