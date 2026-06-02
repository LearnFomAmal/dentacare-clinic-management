import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Droplets,
  FileText,
  Mail,
  Phone,
  UserRound,
  VenusAndMars,
  X,
  Upload,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

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
  formatAppointmentDate,
  formatAppointmentTime,
  getCleanStatus,
  getPatientName,
  getStatusBadgeClass,
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
    .replace("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatCompletedAt = (value) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
    appointmentReports,
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
    if (appointmentId) {
      dispatch(fetchDoctorAppointmentDetails(appointmentId));
    }
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

     useEffect(() => {
    if (!appointmentId) return;

    dispatch(clearAppointmentReports());
    dispatch(fetchDoctorAppointmentReports(appointmentId));
  }, [dispatch, appointmentId]);

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

const handleComplete = async () => {
  try {
    const result = await dispatch(
      completeDoctorAppointment(appointmentId)
    ).unwrap();

    toast.success(result.message || "Appointment completed");

    dispatch(fetchDoctorAppointmentDetails(appointmentId));
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

              {appointment.status === "completed" && (
                <div className="mt-5 rounded-2xl bg-green-50 p-5">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-green-700">
                    <CheckCircle2 size={18} />
                    Appointment completed
                  </p>

                  <p className="mt-2 text-xs font-bold text-green-600">
                    Completed at {formatCompletedAt(appointment.completedAt)}
                  </p>
                </div>
              )}
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
               {appointment.status === "completed" && (
              <PrescriptionSection
                reports={appointmentReports}
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

              {appointment.completedAt && (
                <InfoRow
                  label="Completed At"
                  value={formatCompletedAt(appointment.completedAt)}
                />
              )}
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

            {appointment.status === "approved" && (
              <div className="mt-6">
                <button
                  type="button"
                  disabled={isCompleting}
                  onClick={handleComplete}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white transition hover:bg-[#7E6EF2] disabled:opacity-60"
                >
                  <CheckCircle2 size={17} />
                  {isCompleting ? "Completing..." : "Mark as Completed"}
                </button>

                <p className="mt-3 rounded-2xl bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-600">
                  Completing this appointment may trigger referral reward credit
                  if this is the patient's first completed appointment.
                </p>
              </div>
            )}

            {appointment.status === "completed" && (
              <div className="mt-6 rounded-2xl bg-green-50 p-4">
                <p className="text-xs font-bold uppercase text-green-600">
                  Completed
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-green-700">
                  This appointment has been marked as completed.
                </p>
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

function PrescriptionSection({
  reports,
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
  const prescriptions = reports.filter(
    (report) => report.reportType === "prescription"
  );

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
          Prescription upload is allowed only after the appointment is completed.
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
        ) : prescriptions.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-6 text-center text-sm font-bold text-[#6B7280]">
            No prescription uploaded yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {prescriptions.map((report) => (
              <PrescriptionCard key={report._id} report={report} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PrescriptionCard({ report }) {
  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF]">
          <FileText size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-extrabold text-[#111827]">
            {report.title}
          </h4>

          <p className="mt-2 whitespace-pre-line rounded-2xl bg-white p-4 text-sm leading-7 text-[#374151]">
            {report.prescriptionText}
          </p>

          {report.description && (
            <p className="mt-3 text-xs font-semibold leading-5 text-[#6B7280]">
              {report.description}
            </p>
          )}

          {report.file?.url && (
            <a
              href={report.file.url}
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

export default DoctorAppointmentDetailsPage;