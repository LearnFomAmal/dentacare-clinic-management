import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  IndianRupee,
  Paperclip,
  Phone,
  Stethoscope,
  Trash2,
  Upload,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PatientLayout from "../../components/patient/PatientLayout";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  fetchPublicDoctorDetails,
} from "../../features/doctor/publicDoctorSlice";

import {
  deleteDraftReport,
  fetchDraftReports,
  uploadBookingReport,
} from "../../features/reports/reportSlice";

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

const formatDate = (dateString) => {
  if (!dateString) return "Not selected";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
};

function BookAppointmentPage() {
  const { doctorId } = useParams();
  const dispatch = useAppDispatch();

  const {
    selectedDoctor,
    selectedDate,
    selectedSlotsByDoctor,
    isLoadingDetails,
  } = useAppSelector((state) => state.publicDoctors);

  const {
    draftReports,
    isUploading,
    isLoading,
    isDeleting,
    error,
  } = useAppSelector((state) => state.reports);

  const selectedSlot = selectedSlotsByDoctor[doctorId];

  const [bookingReason, setBookingReason] = useState("");

  const [reportForm, setReportForm] = useState({
    title: "",
    reportType: "other",
    description: "",
    file: null,
  });

  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  useEffect(() => {
    if (doctorId && (!selectedDoctor || selectedDoctor._id !== doctorId)) {
      dispatch(fetchPublicDoctorDetails(doctorId));
    }
  }, [dispatch, doctorId, selectedDoctor]);

  useEffect(() => {
    dispatch(fetchDraftReports());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const doctor = selectedDoctor;

  const consultationFee = doctor?.professionalInfo?.consultationFee || 0;

  const selectedReportIds = useMemo(() => {
    return draftReports.map((report) => report._id);
  }, [draftReports]);

  const handleReportFormChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "file") {
      const file = files?.[0];

      setReportForm((prev) => ({
        ...prev,
        file: file || null,
      }));

      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      if (file && file.type.startsWith("image/")) {
        setLocalPreviewUrl(URL.createObjectURL(file));
      } else {
        setLocalPreviewUrl("");
      }

      return;
    }

    setReportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetReportForm = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    setLocalPreviewUrl("");

    setReportForm({
      title: "",
      reportType: "other",
      description: "",
      file: null,
    });

    const fileInput = document.getElementById("report-file-input");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleUploadReport = async () => {
    if (!reportForm.title.trim()) {
      toast.error("Report title is required");
      return;
    }

    if (!reportForm.file) {
      toast.error("Please choose a report file");
      return;
    }

    const formData = new FormData();

    formData.append("title", reportForm.title.trim());
    formData.append("reportType", reportForm.reportType);
    formData.append("description", reportForm.description.trim());
    formData.append("file", reportForm.file);

    try {
      const result = await dispatch(uploadBookingReport(formData)).unwrap();

      toast.success(result.message || "Report uploaded successfully");
      resetReportForm();
    } catch (err) {
      toast.error(err || "Failed to upload report");
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const result = await dispatch(deleteDraftReport(reportId)).unwrap();

      toast.success(result.message || "Report deleted successfully");
    } catch (err) {
      toast.error(err || "Failed to delete report");
    }
  };

  const handleContinueToPayment = () => {
    if (!doctor) {
      toast.error("Doctor details not found");
      return;
    }

    if (!selectedSlot) {
      toast.error("Please go back and select a slot");
      return;
    }

    if (!bookingReason.trim()) {
      toast.error("Please enter reason for appointment");
      return;
    }

    const bookingPayloadPreview = {
      doctorId,
      slotId: selectedSlot._id,
      appointmentDate: selectedDate,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      reason: bookingReason.trim(),
      reportIds: selectedReportIds,
      pricing: {
        consultationFee,
        totalDiscount: 0,
        finalAmount: consultationFee,
      },
    };

    console.log("Day 4 booking initiate payload:", bookingPayloadPreview);

    toast.success(
      "Booking details ready. Payment/initiate API will be connected in Day 4."
    );
  };

  return (
    <PatientLayout>
      <main className="mx-auto max-w-[960px] px-6 py-10">
        <Link
          to={`/doctors/${doctorId}`}
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#9381FF]"
        >
          <ArrowLeft size={17} />
          Back to doctor details
        </Link>

        <section className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
            Book appointment
          </p>

          <h1 className="mt-2 text-4xl font-extrabold tracking-[-1px] text-[#111827]">
            Confirm Your Consultation
          </h1>

          <p className="mt-3 max-w-[680px] text-base leading-7 text-[#6B7280]">
            Review doctor details, confirm the selected slot, add reason for
            booking, and upload previous medical reports if available.
          </p>
        </section>

        {isLoadingDetails ? (
          <div className="mt-8 rounded-3xl bg-[#F8FAFC] p-10 text-sm font-bold text-[#6B7280]">
            Loading booking details...
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="space-y-6">
              <DoctorSummaryCard doctor={doctor} />

              <BookingReasonCard
                value={bookingReason}
                onChange={(value) => setBookingReason(value)}
              />

              <ReportUploadCard
                reportForm={reportForm}
                localPreviewUrl={localPreviewUrl}
                isUploading={isUploading}
                onChange={handleReportFormChange}
                onUpload={handleUploadReport}
              />

              <UploadedReportsCard
                reports={draftReports}
                isLoading={isLoading}
                isDeleting={isDeleting}
                onDelete={handleDeleteReport}
              />
            </section>

            <aside className="h-fit rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_18px_48px_rgba(17,24,39,0.06)]">
              <h2 className="text-xl font-extrabold text-[#111827]">
                Booking Summary
              </h2>

              <div className="mt-5 space-y-4">
                <SummaryRow
                  label="Date"
                  value={formatDate(selectedDate)}
                />

                <SummaryRow
                  label="Time"
                  value={
                    selectedSlot
                      ? `${formatTime(selectedSlot.startTime)} – ${formatTime(
                          selectedSlot.endTime
                        )}`
                      : "No slot selected"
                  }
                />

                <SummaryRow
                  label="Reports"
                  value={`${draftReports.length} uploaded`}
                />

                <div className="border-t border-[#EEF0F6] pt-4">
                  <SummaryRow
                    label="Consultation Fee"
                    value={`₹${consultationFee}`}
                    strong
                  />

                  <SummaryRow
                    label="Discount"
                    value="₹0"
                  />

                  <SummaryRow
                    label="Payable Amount"
                    value={`₹${consultationFee}`}
                    highlight
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleContinueToPayment}
                className="mt-6"
              >
                Continue to Payment
              </Button>

              <p className="mt-3 text-xs leading-5 text-[#9CA3AF]">
                Payment and appointment creation will be connected in the next
                backend task.
              </p>
            </aside>
          </div>
        )}
      </main>
    </PatientLayout>
  );
}

function DoctorSummaryCard({ doctor }) {
  if (!doctor) {
    return (
      <div className="rounded-3xl bg-[#F8FAFC] p-8 text-sm font-bold text-[#6B7280]">
        Doctor details not available.
      </div>
    );
  }

  const fullName = doctor.fullName || "Doctor";
  const specialty =
    doctor.specialization?.displayName ||
    doctor.specialization?.name ||
    "Dental Specialist";

  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-[#F0F1FF]">
            {doctor.professionalInfo?.profileImage ? (
              <img
                src={doctor.professionalInfo.profileImage}
                alt={fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-[#9381FF]">
                {fullName.charAt(0)}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-[#111827]">
              Dr. {fullName.replace(/^Dr\.\s*/i, "")}
            </h2>

            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-[#9381FF]">
              <Stethoscope size={16} />
              {specialty}
            </p>

            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#6B7280]">
              <Phone size={15} />
              {doctor.professionalInfo?.contactNumber || "Not available"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#F3EFFF] px-5 py-4 text-[#9381FF]">
          <p className="text-xs font-bold uppercase">Fee</p>
          <p className="mt-1 flex items-center text-2xl font-extrabold">
            <IndianRupee size={22} />
            {doctor.professionalInfo?.consultationFee || 0}
          </p>
        </div>
      </div>
    </div>
  );
}

function BookingReasonCard({ value, onChange }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
          <CalendarDays size={20} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">
            Reason for Appointment
          </h2>

          <p className="text-sm text-[#6B7280]">
            Tell the doctor why you are booking this consultation.
          </p>
        </div>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        placeholder="Example: Tooth pain, gum bleeding, braces consultation..."
        className="w-full resize-none rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 text-sm font-medium outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
      />
    </div>
  );
}

function ReportUploadCard({
  reportForm,
  localPreviewUrl,
  isUploading,
  onChange,
  onUpload,
}) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
          <Upload size={20} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">
            Upload Previous Report
          </h2>

          <p className="text-sm text-[#6B7280]">
            Add X-rays, prescriptions, or previous dental records.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input
          type="text"
          name="title"
          value={reportForm.title}
          onChange={onChange}
          placeholder="Report title"
          className="h-12 rounded-2xl border border-[#E5E7EB] px-4 text-sm font-semibold outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
        />

        <select
          name="reportType"
          value={reportForm.reportType}
          onChange={onChange}
          className="h-12 rounded-2xl border border-[#E5E7EB] px-4 text-sm font-semibold outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
        >
          <option value="other">Other</option>
          <option value="xray">X-Ray</option>
          <option value="prescription">Prescription</option>
          <option value="lab_report">Lab Report</option>
          <option value="medical_history">Medical History</option>
        </select>
      </div>

      <textarea
        name="description"
        value={reportForm.description}
        onChange={onChange}
        rows={3}
        placeholder="Short description about this report..."
        className="mt-4 w-full resize-none rounded-2xl border border-[#E5E7EB] px-4 py-4 text-sm font-medium outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
      />

      <div className="mt-4 rounded-2xl border-2 border-dashed border-[#DAD7FF] bg-[#FBFAFF] p-5">
        <input
          id="report-file-input"
          type="file"
          name="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={onChange}
          className="block w-full text-sm font-semibold text-[#6B7280] file:mr-4 file:rounded-xl file:border-0 file:bg-[#9381FF] file:px-5 file:py-3 file:text-sm file:font-bold file:text-white"
        />

        {reportForm.file && (
          <div className="mt-4 rounded-2xl bg-white p-4">
            <div className="flex items-center gap-3">
              <Paperclip size={18} className="text-[#9381FF]" />

              <div>
                <p className="text-sm font-bold text-[#111827]">
                  {reportForm.file.name}
                </p>

                <p className="text-xs text-[#6B7280]">
                  {(reportForm.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            {localPreviewUrl && (
              <img
                src={localPreviewUrl}
                alt="Report preview"
                className="mt-4 h-40 w-full rounded-2xl object-cover"
              />
            )}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          loading={isUploading}
          disabled={isUploading}
          onClick={onUpload}
          fullWidth={false}
          className="min-w-[180px]"
        >
          Upload Report
        </Button>
      </div>
    </div>
  );
}

function UploadedReportsCard({
  reports,
  isLoading,
  isDeleting,
  onDelete,
}) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
          <FileText size={20} />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">
            Uploaded Reports
          </h2>

          <p className="text-sm text-[#6B7280]">
            These reports will be attached to your appointment in Day 4.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="rounded-2xl bg-[#F8FAFC] p-5 text-sm font-bold text-[#6B7280]">
          Loading uploaded reports...
        </p>
      ) : reports.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-6 text-center text-sm font-bold text-[#6B7280]">
          No reports uploaded yet.
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report._id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#111827]">
                  {report.title}
                </p>

                <p className="mt-1 text-xs capitalize text-[#6B7280]">
                  {report.reportType?.replace("_", " ")}
                </p>

                <a
                  href={report.file?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-bold text-[#9381FF]"
                >
                  Preview file
                </a>
              </div>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => onDelete(report._id)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  highlight = false,
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-[#6B7280]">{label}</span>

      <span
        className={`text-right ${
          highlight
            ? "text-lg font-extrabold text-[#9381FF]"
            : strong
              ? "font-extrabold text-[#111827]"
              : "font-bold text-[#111827]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default BookAppointmentPage;