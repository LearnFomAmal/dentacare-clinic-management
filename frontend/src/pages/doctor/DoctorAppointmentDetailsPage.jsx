import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Droplets,
  FileText,
  Mail,
  Phone,
  UserRound,
  VenusAndMars,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import RejectAppointmentModal from "../../components/appointments/RejectAppointmentModal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  approveDoctorAppointment,
  clearAppointmentError,
  fetchDoctorAppointmentDetails,
  rejectDoctorAppointment,
} from "../../features/appointment/appointmentSlice";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getCleanStatus,
  getPatientName,
  getStatusBadgeClass,
} from "../../utils/appointmentUi";

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return "Not available";

  const dob = new Date(dateOfBirth);

  if (Number.isNaN(dob.getTime())) {
    return "Not available";
  }

  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const monthDiff = today.getMonth() - dob.getMonth();
  const dayDiff = today.getDate() - dob.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return `${age} years`;
};

const formatText = (value) => {
  if (!value) return "Not available";

  return String(value)
    .replace("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

function DoctorAppointmentDetailsPage() {
  const { appointmentId } = useParams();
  const dispatch = useAppDispatch();

  const { selectedAppointment, isLoadingDetails, isDeciding, error } =
    useAppSelector((state) => state.appointments);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      dispatch(fetchDoctorAppointmentDetails(appointmentId));
    }
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  const appointment = selectedAppointment;

  const patient = appointment?.patientId;

  const patientInfo = useMemo(() => {
    const personalInfo = patient?.personalInfo || {};

    return {
      name: getPatientName(appointment),
      email: patient?.email || "Not available",
      phoneNumber: personalInfo.phoneNumber || "Not available",
      gender: formatText(personalInfo.gender),
      bloodGroup: personalInfo.bloodGroup || "Not available",
      dateOfBirth: personalInfo.dateOfBirth || null,
      age: calculateAge(personalInfo.dateOfBirth),
      profileImage: personalInfo.profileImage || patient?.profileImage || "",
    };
  }, [appointment, patient]);

  const handleApprove = async () => {
    try {
      const result = await dispatch(
        approveDoctorAppointment(appointmentId)
      ).unwrap();

      toast.success(result.message || "Appointment approved");
    } catch (err) {
      toast.error(err || "Failed to approve appointment");
    }
  };

  const handleReject = async ({ reasonType, reason }) => {
    if (!reason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      const result = await dispatch(
        rejectDoctorAppointment({
          appointmentId,
          reasonType,
          reason,
        })
      ).unwrap();

      toast.success(result.message || "Appointment rejected");
      setRejectModalOpen(false);
    } catch (err) {
      toast.error(err || "Failed to reject appointment");
    }
  };

  return (
    <DashboardLayout title="Appointment Details">
      <Link
        to="/doctor/appointments"
        className="mb-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#9381FF]"
      >
        <ArrowLeft size={17} />
        Back to appointments
      </Link>

      {isLoadingDetails ? (
        <div className="rounded-3xl bg-white p-10 text-sm font-bold text-[#6B7280]">
          Loading appointment details...
        </div>
      ) : !appointment ? (
        <div className="rounded-3xl bg-red-50 p-10 text-sm font-bold text-red-600">
          Appointment not found.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <PatientAvatar patientInfo={patientInfo} />

                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.7px] text-[#9381FF]">
                      Patient
                    </p>

                    <h2 className="mt-1 text-2xl font-extrabold text-[#111827]">
                      {patientInfo.name}
                    </h2>

                    <p className="mt-2 text-sm font-bold text-[#6B7280]">
                      {formatAppointmentDate(appointment.appointmentDate)} ·{" "}
                      {formatAppointmentTime(appointment.startTime)} -{" "}
                      {formatAppointmentTime(appointment.endTime)}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-extrabold capitalize ${getStatusBadgeClass(
                    appointment.status
                  )}`}
                >
                  {getCleanStatus(appointment.status)}
                </span>
              </div>

              <div className="mt-7 rounded-2xl bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
                  Reason for visit
                </p>

                <p className="mt-2 text-sm leading-7 text-[#374151]">
                  {appointment.reason}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
              <div className="mb-5">
                <p className="text-sm font-bold uppercase tracking-[0.8px] text-[#9381FF]">
                  Patient details
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-[#111827]">
                  Basic Medical Information
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <PatientInfoBox
                  icon={Mail}
                  label="Email"
                  value={patientInfo.email}
                />

                <PatientInfoBox
                  icon={Phone}
                  label="Phone Number"
                  value={patientInfo.phoneNumber}
                />

                <PatientInfoBox
                  icon={VenusAndMars}
                  label="Gender"
                  value={patientInfo.gender}
                />

                <PatientInfoBox
                  icon={Droplets}
                  label="Blood Group"
                  value={patientInfo.bloodGroup}
                />

                <PatientInfoBox
                  icon={CalendarDays}
                  label="Age"
                  value={patientInfo.age}
                />

                <PatientInfoBox
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={
                    patientInfo.dateOfBirth
                      ? new Date(patientInfo.dateOfBirth).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "Not available"
                  }
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
              <h2 className="text-xl font-extrabold text-[#111827]">
                Uploaded Reports
              </h2>

              {appointment.reports?.length > 0 ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {appointment.reports.map((report) => (
                    <ReportCard key={report.reportId} report={report} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-6 text-center text-sm font-bold text-[#6B7280]">
                  No reports uploaded.
                </p>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_18px_48px_rgba(17,24,39,0.06)]">
            <h2 className="text-xl font-extrabold text-[#111827]">
              Decision
            </h2>

            <div className="mt-5">
              <span
                className={`inline-flex rounded-full border px-4 py-2 text-sm font-extrabold capitalize ${getStatusBadgeClass(
                  appointment.status
                )}`}
              >
                {getCleanStatus(appointment.status)}
              </span>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <InfoRow label="Patient" value={patientInfo.name} />
              <InfoRow label="Payment" value={appointment.paymentStatus} />
              <InfoRow
                label="Amount"
                value={`₹${appointment.pricing?.finalAmount || 0}`}
              />
              <InfoRow
                label="Reports"
                value={`${appointment.reports?.length || 0}`}
              />
            </div>

            {appointment.status === "pending" && (
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={handleApprove}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-green-50 text-sm font-extrabold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
                >
                  <Check size={16} />
                  Approve
                </button>

                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={() => setRejectModalOpen(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  <X size={16} />
                  Reject
                </button>
              </div>
            )}

            {appointment.status === "rejected" && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4">
                <p className="text-xs font-bold uppercase text-red-500">
                  Rejection reason
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-red-700">
                  {appointment.rejection?.reason || "No reason provided"}
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      <RejectAppointmentModal
        open={rejectModalOpen}
        loading={isDeciding}
        appointment={appointment}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleReject}
      />
    </DashboardLayout>
  );
}

function PatientAvatar({ patientInfo }) {
  const initials = patientInfo.name
    ? patientInfo.name.slice(0, 2).toUpperCase()
    : "PT";

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#F0F1FF] text-2xl font-extrabold text-[#9381FF]">
      {patientInfo.profileImage ? (
        <img
          src={patientInfo.profileImage}
          alt={patientInfo.name}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

function PatientInfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
        <Icon size={18} />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-extrabold text-[#111827]">
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#EEF0F6] pb-3 last:border-0">
      <span className="text-[#6B7280]">{label}</span>
      <span className="text-right font-extrabold capitalize text-[#111827]">
        {value}
      </span>
    </div>
  );
}

function ReportCard({ report }) {
  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4">
      <FileText size={18} className="text-[#9381FF]" />

      <p className="mt-3 text-sm font-extrabold text-[#111827]">
        {report.title}
      </p>

      <p className="mt-1 text-xs capitalize text-[#6B7280]">
        {report.reportType?.replace("_", " ")}
      </p>

      {report.fileUrl && (
        <a
          href={report.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-xs font-extrabold text-[#9381FF]"
        >
          Preview file
        </a>
      )}
    </div>
  );
}

export default DoctorAppointmentDetailsPage;