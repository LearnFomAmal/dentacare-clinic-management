import { useEffect, useMemo } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  IndianRupee,
  Phone,
  Star,
  Stethoscope,
} from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import toast from "react-hot-toast";

import PatientLayout from "../../components/patient/PatientLayout";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearPublicDoctorError,
  fetchDoctorAvailableSlots,
  fetchPublicDoctorDetails,
  resetSelectedDateToToday,
  setSelectedDate,
  setSelectedDoctorSlot,
} from "../../features/doctor/publicDoctorSlice";

import { setBookingDraft } from "../../features/appointment/appointmentSlice";
import { saveBookingDraft } from "../../utils/bookingDraftStorage";

import {
  getLocalDateString,
 getNextFiveLocalDays,
  isDateBeforeToday,
} from "../../utils/dateUtils";

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
  const [searchParams] = useSearchParams();

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

  const days = useMemo(() => getNextFiveLocalDays(), []);

  const safeSelectedDate = isDateBeforeToday(selectedDate)
    ? getLocalDateString()
    : selectedDate;

  const sortedSlots = useMemo(() => {
    const slots = availableSlotData?.slots || [];

    return [...slots].sort(
      (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
  }, [availableSlotData]);

  useEffect(() => {
    if (isDateBeforeToday(selectedDate)) {
      dispatch(resetSelectedDateToToday());
    }
  }, [dispatch, selectedDate]);

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
          date: safeSelectedDate,
        })
      );
    }
  }, [dispatch, doctorId, safeSelectedDate]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearPublicDoctorError());
  }, [error, dispatch]);

  const handleDateSelect = (date) => {
    if (isDateBeforeToday(date)) {
      toast.error("You cannot select a past date");
      return;
    }

    dispatch(setSelectedDate(date));
  };

  const handleSlotSelect = (slot) => {
    if (!slot.isBookable) {
      toast.error(slot.unavailableMessage || "This slot is not bookable");
      return;
    }

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

  if (!selectedSlot.isBookable) {
    toast.error(
      selectedSlot.unavailableMessage ||
        "Selected slot is no longer available. Please choose another slot."
    );
    return;
  }

  if (selectedSlot.isReservedByMe && selectedSlot.existingAppointmentId) {
    toast.success("This slot is already reserved for you. Continue payment.");

    navigate(`/payment/${selectedSlot.existingAppointmentId}`);
    return;
  }

  const slotDayId =
    selectedSlot?.slotDayId ||
    availableSlotData?.slotDayId ||
    availableSlotData?._id;

  if (!slotDayId) {
    toast.error("Slot day information missing. Please reselect slot.");
    return;
  }

  const bookingDraft = {
    doctorId,
    selectedDate: safeSelectedDate,
    slotDayId,
    selectedSlot: {
      ...selectedSlot,
      slotDayId,
    },
  };

  saveBookingDraft(bookingDraft);
  dispatch(setBookingDraft(bookingDraft));

  const couponFromBanner = searchParams.get("coupon") || "";

  const couponQuery = couponFromBanner
    ? `?coupon=${encodeURIComponent(couponFromBanner)}`
    : "";

  navigate(`/book-appointment/${doctorId}${couponQuery}`);
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
            <DoctorReviewsSection doctor={selectedDoctor} />

            <section>
              <h2 className="text-2xl font-extrabold tracking-[-0.5px] text-[#111827]">
                Select Available Slot
              </h2>

              <p className="mt-2 text-sm text-[#6B7280]">
                Choose a valid date, then select a consultation time.
              </p>

              <div className="mt-5 flex gap-4 overflow-x-auto pb-4">
                {days.map((item) => (
                  <DateCard
                    key={item.date}
                    item={item}
                    active={safeSelectedDate === item.date}
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
                    {availableSlotData?.dayOfWeek === "Sunday"
                      ? "Sunday holiday. No slots available."
                      : "Doctor is not available on this date. Please select another date."}
                  </div>
                ) : sortedSlots.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {sortedSlots.map((slot) => {
                      const active = selectedSlot?._id === slot._id;
                      const disabled = !slot.isBookable;

                      return (
                        <button
                          key={slot._id}
                          type="button"
                          disabled={disabled}
                          onClick={() => handleSlotSelect(slot)}
                          className={`min-h-16 rounded-2xl border px-4 py-3 text-sm font-extrabold transition ${
                            active
                              ? "border-green-200 bg-green-100 text-green-700 shadow-[0_12px_26px_rgba(34,197,94,0.16)]"
                              : disabled
                                ? "cursor-not-allowed border-[#E5E7EB] bg-[#F3F4F6] text-[#9CA3AF]"
                                : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#9381FF] hover:bg-[#F0F1FF] hover:text-[#9381FF]"
                          }`}
                        >
                          <span className="block">
                            {formatTime(slot.startTime)} –{" "}
                            {formatTime(slot.endTime)}
                          </span>

                         {slot.isReservedByMe && (
  <span className="mt-1 inline-flex rounded-full bg-green-100 px-3 py-1 text-[11px] font-extrabold text-green-700">
    Reserved for you
  </span>
)}

{disabled && (
  <span
    className={`mt-1 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${
      slot.unavailableReason === "expired"
        ? "bg-zinc-200 text-zinc-600"
        : slot.unavailableReason === "too_soon"
          ? "bg-orange-100 text-orange-600"
          : "bg-slate-200 text-slate-600"
    }`}
  >
    {slot.unavailableMessage || "Unavailable"}
  </span>
)}
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
                  disabled={!selectedSlot || !selectedSlot?.isBookable}
                  className="h-[52px] min-w-[220px] rounded-2xl bg-[#9381FF] px-8 py-4 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:bg-[#C4BFFF] disabled:shadow-none"
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
                text={`${
                  doctor.professionalInfo?.experience || 0
                } Years Experience`}
              />

              <ProfilePill
                icon={Phone}
                text={`No: ${
                  doctor.professionalInfo?.contactNumber || "Not available"
                }`}
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

      {item.label === "Today" || item.label === "Tomorrow" ? (
        <p className="mt-3 text-sm font-bold opacity-90">
          {item.day} {item.month}
        </p>
      ) : (
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
    </button>
  );
}

function DoctorReviewsSection({ doctor }) {
  const summary = doctor?.reviewSummary || {
    averageRating: doctor?.stats?.averageRating || 0,
    totalReviews: doctor?.stats?.totalReviews || 0,
    ratingDistribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
  };

  const reviews = doctor?.latestReviews || [];
  const totalReviews = Number(summary.totalReviews || 0);

  return (
    <section className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
            Patient Reviews
          </p>

          <h2 className="mt-2 text-2xl font-extrabold text-[#111827]">
            What patients say about this doctor
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Reviews are shown only after admin approval.
          </p>
        </div>

        <div className="rounded-2xl bg-[#F8FAFC] px-5 py-4 text-center">
          <p className="flex items-center justify-center gap-2 text-3xl font-extrabold text-[#111827]">
            <Star size={24} fill="currentColor" className="text-[#F59E0B]" />
            {summary.averageRating || 0}
          </p>

          <p className="mt-1 text-xs font-bold text-[#6B7280]">
            {totalReviews} approved reviews
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = summary.ratingDistribution?.[rating] || 0;
          const percentage = totalReviews
            ? Math.round((count / totalReviews) * 100)
            : 0;

          return (
            <div key={rating} className="rounded-2xl bg-[#F8FAFC] p-4">
              <p className="flex items-center gap-1 text-sm font-extrabold text-[#111827]">
                {rating}
                <Star size={14} fill="currentColor" className="text-[#F59E0B]" />
              </p>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className="h-full rounded-full bg-[#9381FF]"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs font-bold text-[#6B7280]">
                {count} reviews
              </p>
            </div>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-8 text-center">
          <h3 className="font-extrabold text-[#111827]">
            No approved reviews yet
          </h3>

          <p className="mt-2 text-sm text-[#6B7280]">
            Be the first patient to review after completing an appointment.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <PublicReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
}

function PublicReviewCard({ review }) {
  const patientName =
    review.patientId?.username || review.patientId?.email || "Patient";

  const profileImage = review.patientId?.personalInfo?.profileImage || "";

  return (
    <article className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 overflow-hidden rounded-full bg-[#F0F1FF]">
          {profileImage ? (
            <img
              src={profileImage}
              alt={patientName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-extrabold text-[#9381FF]">
              {patientName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-[#111827]">
            {patientName}
          </h3>

          <div className="mt-1 flex items-center gap-1 text-[#F59E0B]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={index}
                size={14}
                fill={
                  index < Number(review.rating)
                    ? "currentColor"
                    : "none"
                }
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#374151]">
        {review.description}
      </p>
    </article>
  );
}

export default DoctorDetailsPage;