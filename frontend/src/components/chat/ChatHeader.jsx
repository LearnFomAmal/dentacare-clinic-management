import { ArrowLeft, CalendarDays, Clock, Stethoscope, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../../constants/routes";

const formatDate = (value) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "N/A";

  const [hourValue, minute] = time.split(":").map(Number);
  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
};

const getDoctorName = (doctor) => {
  if (!doctor) return "Doctor";

  return `Dr. ${[doctor.firstName, doctor.lastName].filter(Boolean).join(" ")}`;
};

const getPatientName = (patient) => {
  return patient?.username || patient?.email || "Patient";
};

function ChatHeader({ chat, role }) {
  const appointment = chat?.appointmentId;
  const doctor = chat?.doctorId;
  const patient = chat?.patientId;

  const displayName =
    role === "doctor" ? getPatientName(patient) : getDoctorName(doctor);

  const subtitle =
    role === "doctor"
      ? patient?.email || "Patient"
      : doctor?.specialization?.displayName ||
        doctor?.specialization?.name ||
        "Dental Specialist";

  const backPath = role === "doctor" ? ROUTES.DOCTOR_CHATS : ROUTES.CHATS;

  return (
    <div className="border-b border-[#EEF0F6] bg-white px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <Link
            to={backPath}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#6B7280] transition hover:bg-[#F0F1FF] hover:text-[#9381FF]"
          >
            <ArrowLeft size={18} />
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
              {role === "doctor" ? <UserRound size={22} /> : <Stethoscope size={22} />}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-lg font-extrabold text-[#111827]">
                {displayName}
              </h1>

              <p className="mt-1 truncate text-xs font-bold text-[#6B7280]">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden rounded-2xl bg-[#F8FAFC] px-4 py-3 text-right md:block">
          <p className="flex items-center justify-end gap-2 text-xs font-bold text-[#6B7280]">
            <CalendarDays size={13} />
            {formatDate(appointment?.appointmentDate)}
          </p>

          <p className="mt-1 flex items-center justify-end gap-2 text-xs font-bold text-[#6B7280]">
            <Clock size={13} />
            {formatTime(appointment?.startTime)} - {formatTime(appointment?.endTime)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;