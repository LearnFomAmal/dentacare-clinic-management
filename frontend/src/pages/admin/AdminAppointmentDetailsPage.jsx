import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  Mail,
  Phone,
  UserRound,
  VenusAndMars,
  Droplet,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import RejectAppointmentModal from "../../components/appointments/RejectAppointmentModal";
import CancelAppointmentModal from "../../components/appointments/CancelAppointmentModal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  approveAdminAppointment,
  cancelAdminAppointment,
  clearAppointmentError,
  fetchAdminAppointmentDetails,
  rejectAdminAppointment,
} from "../../features/appointment/appointmentSlice";

import {
  formatAppointmentDate,
  formatAppointmentTime,
  getCleanStatus,
  getDoctorName,
  getPatientName,
  getSpecialtyName,
  getStatusBadgeClass,
} from "../../utils/appointmentUi";

const getPatient = (appointment) => {
  const patient = appointment?.patientId;

  if (!patient || typeof patient !== "object") {
    return null;
  }

  return patient;
};

const formatPatientGender = (gender) => {
  if (!gender) return "Not provided";

  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

const formatBloodGroup = (bloodGroup) => {
  return bloodGroup || "Not provided";
};

const formatDateOfBirth = (dateValue) => {
  if (!dateValue) return "Not provided";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateAge = (dateValue) => {
  if (!dateValue) return "Not provided";

  const dob = new Date(dateValue);

  if (Number.isNaN(dob.getTime())) {
    return "Not provided";
  }

  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dob.getDate())
  ) {
    age -= 1;
  }

  return `${age} years`;
};

const formatDateTime = (value) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function AdminAppointmentDetailsPage() {
  const { appointmentId } = useParams();
  const dispatch = useAppDispatch();

  const {
    selectedAppointment,
    isLoadingDetails,
    isDeciding,
    isCancelling,
    error,
  } = useAppSelector((state) => state.appointments);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;

    dispatch(fetchAdminAppointmentDetails(appointmentId));
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  const appointment = selectedAppointment;
  const patient = getPatient(appointment);

  const handleApprove = async () => {
    try {
      const result = await dispatch(
        approveAdminAppointment(appointmentId)
      ).unwrap();

      toast.success(result.message || "Appointment approved");
      dispatch(fetchAdminAppointmentDetails(appointmentId));
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
        rejectAdminAppointment({
          appointmentId,
          reasonType,
          reason,
        })
      ).unwrap();

      toast.success(result.message || "Appointment rejected");
      setRejectModalOpen(false);
      dispatch(fetchAdminAppointmentDetails(appointmentId));
    } catch (err) {
      toast.error(err || "Failed to reject appointment");
    }
  };

  const handleCancelAppointment = async ({ reasonType, reason }) => {
    if (!reason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }

    try {
      const result = await dispatch(
        cancelAdminAppointment({
          appointmentId,
          reasonType,
          reason,
        })
      ).unwrap();

      toast.success(result.message || "Appointment cancelled");
      setCancelModalOpen(false);
      dispatch(fetchAdminAppointmentDetails(appointmentId));
    } catch (err) {
      toast.error(err || "Failed to cancel appointment");
    }
  };

  const canCancel =
    appointment && ["pending", "approved"].includes(appointment.status);

  return (
    <DashboardLayout title="Appointment Details">
      <Link
        to="/admin/appointments"
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-extrabold text-[#111827]">
                    {getPatientName(appointment)}
                  </h2>

                  <p className="mt-2 text-sm font-bold text-[#6B7280]">
                    Doctor: Dr. {getDoctorName(appointment)} ·{" "}
                    {getSpecialtyName(appointment)}
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full border px-4 py-2 text-sm font-extrabold capitalize ${getStatusBadgeClass(
                    appointment.status
                  )}`}
                >
                  {getCleanStatus(appointment.status)}
                </span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <InfoBox
                  label="Date"
                  value={formatAppointmentDate(appointment.appointmentDate)}
                />

                <InfoBox
                  label="Time"
                  value={`${formatAppointmentTime(
                    appointment.startTime
                  )} - ${formatAppointmentTime(appointment.endTime)}`}
                />

                <InfoBox
                  label="Amount"
                  value={`₹${appointment.pricing?.finalAmount || 0}`}
                />
              </div>

              <div className="mt-5 rounded-2xl bg-[#F8FAFC] p-5">
                <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
                  Reason for visit
                </p>

                <p className="mt-2 text-sm leading-7 text-[#374151]">
                  {appointment.reason || "No reason provided"}
                </p>
              </div>
            </div>

            <PatientDetailsCard patient={patient} />

            <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
              <h2 className="text-xl font-extrabold text-[#111827]">
                Uploaded Reports
              </h2>

              {appointment.reports?.length > 0 ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {appointment.reports.map((report, index) => (
                    <ReportCard
                      key={report.reportId || `${report.title}-${index}`}
                      report={report}
                    />
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
              Admin Decision
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
              <InfoRow label="Payment" value={appointment.paymentStatus} />
              <InfoRow
                label="Transaction"
                value={appointment.paymentSummary?.transactionId || "N/A"}
              />
              <InfoRow
                label="Reports"
                value={`${appointment.reports?.length || 0}`}
              />

              <InfoRow
                label="Completed At"
                value={formatDateTime(appointment.completedAt)}
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

            {canCancel && (
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelModalOpen(true)}
                className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-50 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                <X size={16} />
                {isCancelling ? "Cancelling..." : "Cancel Appointment"}
              </button>
            )}

            {appointment.status === "rejected" && (
              <div className="mt-6 rounded-2xl bg-red-50 p-4">
                <p className="text-xs font-bold uppercase text-red-500">
                  Rejected by {appointment.rejection?.rejectedBy || "N/A"}
                </p>

                <p className="mt-2 text-sm leading-6 text-red-700">
                  {appointment.rejection?.reason || "No reason provided"}
                </p>
              </div>
            )}

            {appointment.status === "cancelled" && (
              <div className="mt-6 rounded-2xl bg-slate-100 p-4">
                <p className="text-xs font-bold uppercase text-slate-600">
                  Cancelled by {appointment.cancellation?.cancelledBy || "N/A"}
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {appointment.cancellation?.reason || "No reason provided"}
                </p>

                {appointment.paymentStatus === "refunded" && (
                  <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-xs font-extrabold text-green-700">
                    Refund credited to patient wallet.
                  </p>
                )}
              </div>
            )}

            {appointment.status === "completed" && (
              <div className="mt-6 rounded-2xl bg-green-50 p-4">
                <p className="text-xs font-bold uppercase text-green-600">
                  Completed
                </p>

                <p className="mt-2 text-sm leading-6 text-green-700">
                  This appointment has already been completed.
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

      <CancelAppointmentModal
        open={cancelModalOpen}
        loading={isCancelling}
        actor="admin"
        appointment={appointment}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelAppointment}
      />
    </DashboardLayout>
  );
}

function PatientDetailsCard({ patient }) {
  if (!patient) {
    return (
      <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
        <h2 className="text-xl font-extrabold text-[#111827]">
          Patient Details
        </h2>

        <p className="mt-4 rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-600">
          Patient information is not available.
        </p>
      </div>
    );
  }

  const profileImage =
    patient.personalInfo?.profileImage || patient.profileImage || "";

  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F0F1FF] text-lg font-extrabold text-[#9381FF]">
          {profileImage ? (
            <img
              src={profileImage}
              alt={patient.username || "Patient"}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserRound size={24} />
          )}
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">
            Patient Details
          </h2>

          <p className="mt-1 text-sm font-semibold text-[#6B7280]">
            Medical and contact information of the patient.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PatientInfoBox
          icon={UserRound}
          label="Patient Name"
          value={patient.username || "Not provided"}
        />

        <PatientInfoBox
          icon={Mail}
          label="Email"
          value={patient.email || "Not provided"}
          normalCase
        />

        <PatientInfoBox
          icon={Phone}
          label="Phone"
          value={patient.personalInfo?.phoneNumber || "Not provided"}
        />

        <PatientInfoBox
          icon={VenusAndMars}
          label="Gender"
          value={formatPatientGender(patient.personalInfo?.gender)}
        />

        <PatientInfoBox
          icon={Droplet}
          label="Blood Group"
          value={formatBloodGroup(patient.personalInfo?.bloodGroup)}
        />

        <PatientInfoBox
          icon={CalendarDays}
          label="Age"
          value={calculateAge(patient.personalInfo?.dateOfBirth)}
        />

        <PatientInfoBox
          icon={CalendarDays}
          label="Date of Birth"
          value={formatDateOfBirth(patient.personalInfo?.dateOfBirth)}
        />
      </div>
    </div>
  );
}

function PatientInfoBox({ icon: Icon, label, value, normalCase = false }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF]">
        <Icon size={17} />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
        {label}
      </p>

      <p
        className={`mt-1 break-words text-sm font-extrabold text-[#111827] ${
          normalCase ? "normal-case" : "capitalize"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold capitalize text-[#111827]">
        {value}
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#EEF0F6] pb-3 last:border-0">
      <span className="text-[#6B7280]">{label}</span>

      <span className="break-all text-right font-extrabold capitalize text-[#111827]">
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
        {report.title || "Untitled report"}
      </p>

      <p className="mt-1 text-xs capitalize text-[#6B7280]">
        {report.reportType?.replace("_", " ") || "Other"}
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

export default AdminAppointmentDetailsPage;