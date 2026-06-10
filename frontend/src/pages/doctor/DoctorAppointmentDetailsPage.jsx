import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Droplets,
  FileText,
  IndianRupee,
  Mail,
  Phone,
  RefreshCcw,
  Upload,
  UserRound,
  VenusAndMars,
  X,
  XCircle,
  MessageCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ROUTES } from "../../constants/routes";
import DashboardLayout from "../../components/layout/DashboardLayout";
import RejectAppointmentModal from "../../components/appointments/RejectAppointmentModal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  approveDoctorAppointment,
  clearAppointmentError,
  completeDoctorAppointment,
  fetchDoctorAppointmentDetails,
  rejectDoctorAppointment,
} from "../../features/appointment/appointmentSlice";

import {
  canCompleteAppointment,
  canDecideAppointment,
  formatAppointmentDate,
  formatAppointmentTime,
  getAppointmentDisplayStatus,
  getCleanStatus,
  getPatientName,
  getStatusBadgeClass,
  isAppointmentEndTimePast,
} from "../../utils/appointmentUi";

import {
  clearAppointmentReports,
  clearReportError,
  fetchDoctorAppointmentReports,
  uploadDoctorPrescription,
} from "../../features/reports/reportSlice";

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
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) => {
  return `₹${Number(value || 0)}`;
};

const getFileUrl = (report) => {
  return report?.file?.url || report?.fileUrl || report?.url || "";
};

function DoctorAppointmentDetailsPage() {
  const { appointmentId } = useParams();
  const dispatch = useAppDispatch();

  const {
    selectedAppointment,
    isLoadingDetails,
    isDeciding,
    isCompleting,
    error,
  } = useAppSelector((state) => state.appointments);

  const {
    appointmentReports = [],
    isLoadingAppointmentReports,
    isUploadingPrescription,
    error: reportError,
  } = useAppSelector((state) => state.reports);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const [prescriptionTitle, setPrescriptionTitle] = useState("");
  const [prescriptionText, setPrescriptionText] = useState("");
  const [prescriptionDescription, setPrescriptionDescription] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState(null);

  useEffect(() => {
    if (!appointmentId) return;

    dispatch(fetchDoctorAppointmentDetails(appointmentId));
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!appointmentId) return;

    dispatch(clearAppointmentReports());
    dispatch(fetchDoctorAppointmentReports(appointmentId));
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  useEffect(() => {
    if (!reportError) return;

    toast.error(reportError);
    dispatch(clearReportError());
  }, [reportError, dispatch]);

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

  const prescriptions = appointmentReports.filter(
    (report) => report.reportType === "prescription"
  );

  const uploadedPatientReports =
    appointment?.reports?.filter(
      (report) => report.reportType !== "prescription"
    ) || [];

  const canApproveOrReject = canDecideAppointment(appointment);
  const canComplete = canCompleteAppointment(appointment);
  const canUploadPrescription = appointment?.status === "completed";
  const isPastAppointment = isAppointmentEndTimePast(appointment);
  const isApprovedButNotReadyToComplete =
    appointment?.status === "approved" && !isPastAppointment;
  const isApprovedAwaitingCompletion =
    appointment?.status === "approved" && isPastAppointment;
const chatPath = appointment?._id
  ? ROUTES.DOCTOR_CHAT_APPOINTMENT.replace(
      ":appointmentId",
      appointment._id
    )
  : "";
  const handleApprove = async () => {
    try {
      const result = await dispatch(
        approveDoctorAppointment(appointmentId)
      ).unwrap();

      toast.success(result.message || "Appointment approved");
      dispatch(fetchDoctorAppointmentDetails(appointmentId));
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
      dispatch(fetchDoctorAppointmentDetails(appointmentId));
    } catch (err) {
      toast.error(err || "Failed to reject appointment");
    }
  };

  const handleComplete = async () => {
    try {
      const result = await dispatch(
        completeDoctorAppointment(appointmentId)
      ).unwrap();

      toast.success(result.message || "Appointment completed");

      dispatch(fetchDoctorAppointmentDetails(appointmentId));
      dispatch(fetchDoctorAppointmentReports(appointmentId));
    } catch (err) {
      toast.error(err || "Failed to complete appointment");
    }
  };

  const handlePrescriptionUpload = async (event) => {
    event.preventDefault();

    if (!prescriptionTitle.trim()) {
      toast.error("Prescription title is required");
      return;
    }

    if (!prescriptionText.trim()) {
      toast.error("Prescription text is required");
      return;
    }

    const formData = new FormData();

    formData.append("title", prescriptionTitle.trim());
    formData.append("prescriptionText", prescriptionText.trim());
    formData.append("description", prescriptionDescription.trim());

    if (prescriptionFile) {
      formData.append("file", prescriptionFile);
    }

    try {
      const result = await dispatch(
        uploadDoctorPrescription({
          appointmentId,
          formData,
        })
      ).unwrap();

      toast.success(result.message || "Prescription uploaded");

      setPrescriptionTitle("");
      setPrescriptionText("");
      setPrescriptionDescription("");
      setPrescriptionFile(null);

      dispatch(fetchDoctorAppointmentDetails(appointmentId));
      dispatch(fetchDoctorAppointmentReports(appointmentId));
    } catch (err) {
      toast.error(err || "Failed to upload prescription");
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
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <AppointmentHeaderCard
              appointment={appointment}
              patientInfo={patientInfo}
            />

            <PatientDetailsCard patientInfo={patientInfo} />

            <UploadedReportsSection reports={uploadedPatientReports} />

            <RescheduleHistorySection appointment={appointment} />

            {canUploadPrescription && (
              <PrescriptionSection
                reports={prescriptions}
                isLoading={isLoadingAppointmentReports}
                isUploading={isUploadingPrescription}
                title={prescriptionTitle}
                prescriptionText={prescriptionText}
                description={prescriptionDescription}
                file={prescriptionFile}
                onTitleChange={setPrescriptionTitle}
                onPrescriptionTextChange={setPrescriptionText}
                onDescriptionChange={setPrescriptionDescription}
                onFileChange={setPrescriptionFile}
                onSubmit={handlePrescriptionUpload}
              />
            )}

            {!canUploadPrescription && prescriptions.length > 0 && (
              <PrescriptionPreviewSection
                reports={prescriptions}
                isLoading={isLoadingAppointmentReports}
              />
            )}
          </section>

          <aside className="h-fit rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_18px_48px_rgba(17,24,39,0.06)]">
            <h2 className="text-xl font-extrabold text-[#111827]">
              Appointment Summary
            </h2>

            <div className="mt-5">
              <span
                className={`inline-flex rounded-full border px-4 py-2 text-sm font-extrabold capitalize ${getStatusBadgeClass(
                  appointment.status
                )}`}
              >
                {getAppointmentDisplayStatus(appointment)}
              </span>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <InfoRow label="Patient" value={patientInfo.name} />
              <InfoRow label="Payment" value={appointment.paymentStatus} />
              <InfoRow
                label="Consultation Fee"
                value={formatMoney(appointment.pricing?.consultationFee)}
              />
              <InfoRow
                label="Total Discount"
                value={formatMoney(appointment.pricing?.totalDiscount)}
              />
              <InfoRow
                label="Paid Amount"
                value={formatMoney(appointment.pricing?.finalAmount)}
                highlight
              />
              <InfoRow
                label="Refund Status"
                value={
                  appointment.paymentStatus === "refunded"
                    ? "Refunded to wallet"
                    : "N/A"
                }
              />
              <InfoRow
                label="Transaction"
                value={appointment.paymentSummary?.transactionId || "N/A"}
              />
              <InfoRow
                label="Reports"
                value={`${uploadedPatientReports.length}`}
              />
              <InfoRow label="Prescriptions" value={`${prescriptions.length}`} />

              {appointment.completedAt && (
                <InfoRow
                  label="Completed At"
                  value={formatDateTime(appointment.completedAt)}
                />
              )}
            </div>
              {appointment.status === "approved" && chatPath && (
  <Link
    to={chatPath}
    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(147,129,255,0.24)] transition hover:bg-[#7E6EF2]"
  >
    <MessageCircle size={17} />
    Chat with Patient
  </Link>
)}
            {canApproveOrReject && (
              <div className="mt-6 grid gap-3">
                <button
                  type="button"
                  disabled={isDeciding}
                  onClick={handleApprove}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-green-50 text-sm font-extrabold text-green-700 transition hover:bg-green-100 disabled:opacity-60"
                >
                  <Check size={16} />
                  {isDeciding ? "Processing..." : "Approve"}
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
               {isPastAppointment && appointment.status === "pending" && (
  <StatusMessage
    type="warning"
    title="Appointment time over"
    message="This pending appointment can no longer be approved or rejected. It will be marked as expired automatically."
  />
)}
            {canComplete && (
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  disabled={isCompleting}
                  onClick={handleComplete}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white transition hover:bg-[#7E6EF2] disabled:opacity-60"
                >
                  <CheckCircle2 size={17} />
                  {isCompleting ? "Completing..." : "Mark as Completed"}
                </button>

                <p className="rounded-2xl bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-600">
                  Completing this appointment can trigger referral reward credit
                  if this is the patient&apos;s first completed appointment.
                </p>
              </div>
            )}
           
                       {isApprovedButNotReadyToComplete && (
              <StatusMessage
                type="warning"
                title="Consultation not finished yet"
                message="This appointment is approved, but it can be completed only after the consultation end time."
              />
            )}

            {isApprovedAwaitingCompletion && (
              <StatusMessage
                type="warning"
                title="Approved - Awaiting Completion"
                message="The consultation time is over. Please complete the appointment after checking the patient physically."
              />
            )}
            
            {appointment.status === "completed" && (
              <StatusMessage
                type="success"
                title="Completed"
                message="This appointment has been marked as completed. Prescription upload is now available."
              />
            )}

            {appointment.status === "rejected" && (
              <StatusMessage
                type="danger"
                title={`Rejected by ${
                  appointment.rejection?.rejectedBy || "N/A"
                }`}
                message={appointment.rejection?.reason || "No reason provided"}
              />
            )}

            {appointment.status === "cancelled" && (
              <StatusMessage
                type="neutral"
                title={`Cancelled by ${
                  appointment.cancellation?.cancelledBy || "N/A"
                }`}
                message={appointment.cancellation?.reason || "No reason provided"}
                footer={
                  appointment.paymentStatus === "refunded"
                    ? "Refund credited to patient wallet."
                    : ""
                }
              />
            )}

            {appointment.status === "pending_payment" && (
              <StatusMessage
                type="warning"
                title="Payment Pending"
                message="This booking is reserved but payment is not completed yet."
              />
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

function AppointmentHeaderCard({ appointment, patientInfo }) {
  return (
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
       {getAppointmentDisplayStatus(appointment)}
        </span>
      </div>

      <div className="mt-7 rounded-2xl bg-[#F8FAFC] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
          Reason for visit
        </p>

        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#374151]">
          {appointment.reason || "No reason provided"}
        </p>
      </div>

      {appointment.status === "completed" && (
        <div className="mt-5 rounded-2xl bg-green-50 p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-green-700">
            <CheckCircle2 size={18} />
            Appointment completed
          </p>

          <p className="mt-2 text-xs font-bold text-green-600">
            Completed at {formatDateTime(appointment.completedAt)}
          </p>
        </div>
      )}

      {appointment.status === "cancelled" && (
        <div className="mt-5 rounded-2xl bg-slate-100 p-5">
          <p className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
            <XCircle size={18} />
            Appointment cancelled
          </p>

          <p className="mt-2 text-xs font-bold text-slate-600">
            Cancelled by {appointment.cancellation?.cancelledBy || "N/A"}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            {appointment.cancellation?.reason || "No reason provided"}
          </p>

          {appointment.paymentStatus === "refunded" && (
            <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-xs font-extrabold text-green-700">
              Refund credited to patient wallet.
            </p>
          )}
        </div>
      )}

      {appointment.status === "rejected" && (
        <div className="mt-5 rounded-2xl bg-red-50 p-5">
          <p className="text-xs font-bold uppercase text-red-500">
            Rejected by {appointment.rejection?.rejectedBy || "N/A"}
          </p>

          <p className="mt-2 text-sm leading-6 text-red-700">
            {appointment.rejection?.reason || "No reason provided"}
          </p>
        </div>
      )}
    </div>
  );
}

function PatientDetailsCard({ patientInfo }) {
  return (
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
        <PatientInfoBox icon={Mail} label="Email" value={patientInfo.email} />

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
              ? new Date(patientInfo.dateOfBirth).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Not available"
          }
        />
      </div>
    </div>
  );
}

function UploadedReportsSection({ reports = [] }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <h2 className="text-xl font-extrabold text-[#111827]">
        Patient Uploaded Reports
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6B7280]">
        Reports attached by the patient during appointment booking.
      </p>

      {reports.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {reports.map((report, index) => (
            <ReportCard
              key={report.reportId || report._id || `${report.title}-${index}`}
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
  );
}

function RescheduleHistorySection({ appointment }) {
  const history = appointment?.rescheduleHistory || [];

  if (history.length === 0 && !appointment?.reschedule?.rescheduleCount) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
          <RefreshCcw size={20} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">
            Reschedule History
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Shows previous appointment slot changes requested by the patient.
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-[#F8FAFC] p-5 text-sm font-bold text-[#6B7280]">
          Rescheduled {appointment?.reschedule?.rescheduleCount || 0} time(s).
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {history.map((item, index) => (
            <div
              key={item._id || `${item.rescheduledAt}-${index}`}
              className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5"
            >
              <p className="text-xs font-bold uppercase text-[#9381FF]">
                Reschedule #{index + 1}
              </p>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <SmallInfo
                  label="Previous Slot"
                  value={`${formatAppointmentDate(
                    item.oldAppointmentDate
                  )} · ${formatAppointmentTime(
                    item.oldStartTime
                  )} - ${formatAppointmentTime(item.oldEndTime)}`}
                />

                <SmallInfo
                  label="New Slot"
                  value={`${formatAppointmentDate(
                    item.newAppointmentDate
                  )} · ${formatAppointmentTime(
                    item.newStartTime
                  )} - ${formatAppointmentTime(item.newEndTime)}`}
                />

                <SmallInfo
                  label="Reason Type"
                  value={formatText(item.reasonType)}
                />

                <SmallInfo
                  label="Rescheduled At"
                  value={formatDateTime(item.rescheduledAt)}
                />
              </div>

              <p className="mt-4 rounded-2xl bg-white p-4 text-sm leading-6 text-[#374151]">
                {item.reason || "No reason provided"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrescriptionPreviewSection({ reports = [], isLoading }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <h2 className="text-xl font-extrabold text-[#111827]">
        Uploaded Prescriptions
      </h2>

      {isLoading ? (
        <p className="mt-4 rounded-2xl bg-[#F8FAFC] p-5 text-sm font-bold text-[#6B7280]">
          Loading prescriptions...
        </p>
      ) : reports.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-6 text-center text-sm font-bold text-[#6B7280]">
          No prescription uploaded yet.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {reports.map((report) => (
            <PrescriptionCard key={report._id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function PrescriptionSection({
  reports = [],
  isLoading,
  isUploading,
  title,
  prescriptionText,
  description,
  file,
  onTitleChange,
  onPrescriptionTextChange,
  onDescriptionChange,
  onFileChange,
  onSubmit,
}) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="mb-5">
        <p className="text-sm font-bold uppercase tracking-[0.8px] text-[#9381FF]">
          Prescription
        </p>

        <h2 className="mt-1 text-xl font-extrabold text-[#111827]">
          Upload Prescription
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          Prescription upload is allowed only after the appointment is
          completed.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-3xl bg-[#F8FAFC] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#6B7280]">
              Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Prescription for dental pain"
              className="mt-2 h-12 w-full rounded-2xl border border-[#EEF0F6] bg-white px-4 text-sm font-semibold outline-none focus:border-[#9381FF]"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#6B7280]">
              Optional File
            </label>

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
              onChange={(event) =>
                onFileChange(event.target.files?.[0] || null)
              }
              className="mt-2 block w-full rounded-2xl border border-[#EEF0F6] bg-white px-4 py-3 text-sm font-semibold text-[#6B7280]"
            />

            {file && (
              <p className="mt-2 text-xs font-bold text-[#9381FF]">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#6B7280]">
            Prescription Text
          </label>

          <textarea
            value={prescriptionText}
            onChange={(event) =>
              onPrescriptionTextChange(event.target.value)
            }
            placeholder="Medicine, dosage, instructions, follow-up advice..."
            rows={5}
            className="mt-2 w-full rounded-2xl border border-[#EEF0F6] bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#9381FF]"
          />
        </div>

        <div className="mt-4">
          <label className="text-xs font-bold uppercase tracking-[0.6px] text-[#6B7280]">
            Description Optional
          </label>

          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Extra note for the patient..."
            rows={3}
            className="mt-2 w-full rounded-2xl border border-[#EEF0F6] bg-white px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#9381FF]"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#9381FF] px-6 text-sm font-extrabold text-white transition hover:bg-[#7E6EF2] disabled:opacity-60"
        >
          <Upload size={17} />
          {isUploading ? "Uploading..." : "Upload Prescription"}
        </button>
      </form>

      <div className="mt-7">
        <h3 className="text-lg font-extrabold text-[#111827]">
          Uploaded Prescriptions
        </h3>

        {isLoading ? (
          <p className="mt-4 rounded-2xl bg-[#F8FAFC] p-5 text-sm font-bold text-[#6B7280]">
            Loading prescriptions...
          </p>
        ) : reports.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-6 text-center text-sm font-bold text-[#6B7280]">
            No prescription uploaded yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {reports.map((report) => (
              <PrescriptionCard key={report._id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
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

function SmallInfo({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-[#111827]">{value}</p>
    </div>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#EEF0F6] pb-3 last:border-0">
      <span className="text-[#6B7280]">{label}</span>

      <span
        className={`text-right font-extrabold capitalize ${
          highlight ? "flex items-center text-[#9381FF]" : "text-[#111827]"
        }`}
      >
        {highlight && <IndianRupee size={14} />}
        {highlight ? String(value).replace("₹", "") : value}
      </span>
    </div>
  );
}

function ReportCard({ report }) {
  const fileUrl = getFileUrl(report);

  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4">
      <FileText size={18} className="text-[#9381FF]" />

      <p className="mt-3 text-sm font-extrabold text-[#111827]">
        {report.title || "Untitled report"}
      </p>

      <p className="mt-1 text-xs capitalize text-[#6B7280]">
        {report.reportType?.replace("_", " ") || "Other"}
      </p>

      {fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-xs font-extrabold text-[#9381FF]"
        >
          Preview file
        </a>
      ) : (
        <p className="mt-3 text-xs font-bold text-[#9CA3AF]">
          No file attached
        </p>
      )}
    </div>
  );
}

function PrescriptionCard({ report }) {
  const fileUrl = getFileUrl(report);

  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF]">
          <FileText size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-extrabold text-[#111827]">
            {report.title || "Prescription"}
          </h4>

          {report.prescriptionText && (
            <p className="mt-2 whitespace-pre-line rounded-2xl bg-white p-4 text-sm leading-7 text-[#374151]">
              {report.prescriptionText}
            </p>
          )}

          {report.description && (
            <p className="mt-3 text-xs font-semibold leading-5 text-[#6B7280]">
              {report.description}
            </p>
          )}

          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-xs font-extrabold text-[#9381FF]"
            >
              Preview prescription file
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusMessage({ type, title, message, footer = "" }) {
  const classNameMap = {
    success: "bg-green-50 text-green-700",
    danger: "bg-red-50 text-red-700",
    warning: "bg-orange-50 text-orange-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <div className={`mt-6 rounded-2xl p-4 ${classNameMap[type]}`}>
      <p className="text-xs font-bold uppercase">{title}</p>

      <p className="mt-2 text-sm font-semibold leading-6">{message}</p>

      {footer && <p className="mt-3 text-xs font-extrabold">{footer}</p>}
    </div>
  );
}

export default DoctorAppointmentDetailsPage;