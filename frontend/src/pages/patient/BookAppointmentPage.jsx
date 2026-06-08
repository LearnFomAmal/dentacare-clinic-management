import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Crop,
  FileText,
  IndianRupee,
  Paperclip,
  Phone,
  Stethoscope,
  Trash2,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import ImageCropperModal from "../../components/common/ImageCropperModal";
import PatientLayout from "../../components/patient/PatientLayout";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearBookingDraft,
  getBookingDraft,
} from "../../utils/bookingDraftStorage";
import { formatDateLong } from "../../utils/dateUtils";

import { fetchPublicDoctorDetails } from "../../features/doctor/publicDoctorSlice";

import {
  clearReferralError,
  fetchMyReferral,
} from "../../features/referral/referralSlice";

import {
  deleteDraftReport,
  fetchDraftReports,
  uploadBookingReport,
} from "../../features/reports/reportSlice";

import {
  initiateAppointment,
} from "../../features/appointment/appointmentSlice";

import {
  clearAppliedCoupon,
  clearCouponError,
  fetchAvailableCoupons,
  validateCoupon,
} from "../../features/coupon/couponSlice";

const MAX_REPORT_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_REPORT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

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

const isImageFile = (file) => {
  return file?.type?.startsWith("image/");
};

const isPatientProfileComplete = (user) => {
  return Boolean(
    user?.username &&
      user?.email &&
      user?.personalInfo?.dateOfBirth &&
      user?.personalInfo?.gender &&
      user?.personalInfo?.phoneNumber &&
      user?.personalInfo?.bloodGroup
  );
};

const calculateReferralDiscountPreview = ({ config, amount }) => {
  if (!config?.isActive) return 0;

  const numericAmount = Number(amount || 0);

  if (numericAmount < Number(config.minAppointmentAmount || 0)) {
    return 0;
  }

  let discount = 0;

  if (config.refereeDiscountType === "flat") {
    discount = Number(config.refereeDiscountValue || 0);
  }

  if (config.refereeDiscountType === "percentage") {
    discount =
      (numericAmount * Number(config.refereeDiscountValue || 0)) / 100;

    if (Number(config.maxDiscount || 0) > 0) {
      discount = Math.min(discount, Number(config.maxDiscount));
    }
  }

  return Math.floor(Math.min(discount, numericAmount));
};

function BookAppointmentPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);

  const {
    selectedDoctor,
    selectedDate,
    selectedSlotsByDoctor,
    isLoadingDetails,
  } = useAppSelector((state) => state.publicDoctors);

  const {
    availableCoupons,
    appliedCoupon,
    couponPreview,
    isLoading: isLoadingCoupons,
    isValidating,
    error: couponError,
  } = useAppSelector((state) => state.coupons);

  const {
    draftReports,
    isUploading,
    isLoading,
    isDeleting,
    error: reportError,
  } = useAppSelector((state) => state.reports);

  const { isInitiating } = useAppSelector(
  (state) => state.appointments
);

  const { myReferral, error: referralError } = useAppSelector(
    (state) => state.referrals
  );

  const [bookingReason, setBookingReason] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [cropSourceUrl, setCropSourceUrl] = useState("");
  const [isReportCropOpen, setIsReportCropOpen] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
const [timeConflictWarning, setTimeConflictWarning] = useState(null);
const [pendingBookingPayload, setPendingBookingPayload] = useState(null);



  const [reportForm, setReportForm] = useState({
    title: "",
    reportType: "other",
    description: "",
    file: null,
  });

  const bookingDraft = useMemo(() => {
    return getBookingDraft(doctorId);
  }, [doctorId]);

  const selectedSlot =
    selectedSlotsByDoctor[doctorId] || bookingDraft?.selectedSlot || null;

  const finalSelectedDate = bookingDraft?.selectedDate || selectedDate || "";

  const slotDayId = bookingDraft?.slotDayId || selectedSlot?.slotDayId || "";

  const doctor = selectedDoctor;
  const consultationFee = doctor?.professionalInfo?.consultationFee || 0;

  const selectedReportIds = useMemo(() => {
    return draftReports.map((report) => report._id);
  }, [draftReports]);

 const canShowReferralDiscountPreview = Boolean(
  myReferral?.refereeBenefit?.isAvailable
);

const referralDiscount = canShowReferralDiscountPreview
  ? calculateReferralDiscountPreview({
      config: myReferral?.config,
      amount: consultationFee,
    })
  : 0;

  const couponDiscount = couponPreview?.discount || 0;
  const totalDiscount = couponDiscount + referralDiscount;
  const payableAmount = Math.max(consultationFee - totalDiscount, 0);

  useEffect(() => {
    if (doctorId && (!selectedDoctor || selectedDoctor._id !== doctorId)) {
      dispatch(fetchPublicDoctorDetails(doctorId));
    }
  }, [dispatch, doctorId, selectedDoctor]);

  useEffect(() => {
    dispatch(fetchDraftReports());
    dispatch(fetchMyReferral());
  }, [dispatch]);

  useEffect(() => {
    if (!doctorId || !consultationFee) return;

    dispatch(
      fetchAvailableCoupons({
        doctorId,
        appointmentAmount: consultationFee,
      })
    );
  }, [dispatch, doctorId, consultationFee]);

  useEffect(() => {
    if (!reportError) return;

    toast.error(reportError);
  }, [reportError]);


  useEffect(() => {
    if (!couponError) return;

    toast.error(couponError);
    dispatch(clearCouponError());
  }, [couponError, dispatch]);

  useEffect(() => {
    if (!referralError) return;

    toast.error(referralError);
    dispatch(clearReferralError());
  }, [referralError, dispatch]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      if (cropSourceUrl) {
        URL.revokeObjectURL(cropSourceUrl);
      }
    };
  }, [localPreviewUrl, cropSourceUrl]);

  const handleReportFormChange = (event) => {
    const { name, value, files } = event.target;

    if (name === "file") {
      const file = files?.[0];

      if (!file) return;

      if (!ALLOWED_REPORT_TYPES.includes(file.type)) {
        toast.error("Only JPG, JPEG, PNG, WEBP and PDF files are allowed");
        event.target.value = "";
        return;
      }

      if (file.size > MAX_REPORT_FILE_SIZE) {
        toast.error("Report file size must be less than 5MB");
        event.target.value = "";
        return;
      }

      setReportForm((prev) => ({
        ...prev,
        file,
      }));

      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      if (cropSourceUrl) {
        URL.revokeObjectURL(cropSourceUrl);
      }

      if (isImageFile(file)) {
        const objectUrl = URL.createObjectURL(file);

        setLocalPreviewUrl(objectUrl);
        setCropSourceUrl(objectUrl);
        setIsReportCropOpen(true);
      } else {
        setLocalPreviewUrl("");
        setCropSourceUrl("");
        setIsReportCropOpen(false);
      }

      return;
    }

    setReportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReportCropComplete = (croppedFile) => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    const finalFile = new File(
      [croppedFile],
      reportForm.file?.name || "cropped-report.jpg",
      {
        type: croppedFile.type,
        lastModified: Date.now(),
      }
    );

    const preview = URL.createObjectURL(finalFile);

    setReportForm((prev) => ({
      ...prev,
      file: finalFile,
    }));

    setLocalPreviewUrl(preview);
    setCropSourceUrl(preview);
    setIsReportCropOpen(false);
  };

  const handleCancelReportCrop = () => {
    setIsReportCropOpen(false);
  };

  const handleRemoveReportFile = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    if (cropSourceUrl && cropSourceUrl !== localPreviewUrl) {
      URL.revokeObjectURL(cropSourceUrl);
    }

    setLocalPreviewUrl("");
    setCropSourceUrl("");

    setReportForm((prev) => ({
      ...prev,
      file: null,
    }));

    const fileInput = document.getElementById("report-file-input");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const resetReportForm = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    if (cropSourceUrl) {
      URL.revokeObjectURL(cropSourceUrl);
    }

    setLocalPreviewUrl("");
    setCropSourceUrl("");
    setIsReportCropOpen(false);

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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter coupon code");
      return;
    }

    try {
      const result = await dispatch(
        validateCoupon({
          doctorId,
          couponCode: couponCode.trim(),
          appointmentAmount: consultationFee,
        })
      ).unwrap();

      toast.success(result.message || "Coupon applied successfully");
    } catch (err) {
      toast.error(err || "Failed to apply coupon");
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    dispatch(clearAppliedCoupon());
  };

const submitBooking = async (payload) => {
  const result = await dispatch(initiateAppointment(payload)).unwrap();

  if (result.requiresTimeConflictConfirmation) {
    setTimeConflictWarning({
      message: result.message,
      conflictAppointment: result.conflictAppointment,
    });

    setPendingBookingPayload(payload);
    return;
  }

  clearBookingDraft();

  toast.success(result.message || "Appointment initiated successfully");

  navigate(`/payment/${result.appointment._id}`);
};

const handleContinueToPayment = async () => {
  if (isInitiating) return;

  if (!doctor) {
    toast.error("Doctor details not found");
    return;
  }

  if (!selectedSlot) {
    toast.error("Please go back and select a slot");
    return;
  }

  if (!slotDayId) {
    toast.error(
      "Slot day information missing. Please go back and select slot again."
    );
    return;
  }

  if (!finalSelectedDate) {
    toast.error("Appointment date is missing");
    return;
  }

  if (selectedSlot.isReservedByMe && selectedSlot.existingAppointmentId) {
    clearBookingDraft();

    toast.success("This slot is already reserved for you. Continue payment.");

    navigate(`/payment/${selectedSlot.existingAppointmentId}`);
    return;
  }

  if (!selectedSlot.isBookable) {
    toast.error(
      selectedSlot.unavailableMessage ||
        "Selected slot is no longer available. Please choose another slot."
    );
    return;
  }

  if (!bookingReason.trim()) {
    toast.error("Please enter reason for appointment");
    return;
  }

  if (!isPatientProfileComplete(user)) {
    toast.error("Please complete your profile before booking");

    navigate(ROUTES.USER_SETTINGS, {
      state: {
        reason: "complete_profile_before_booking",
      },
    });

    return;
  }

  const payload = {
    doctorId,
    slotDayId,
    slotId: selectedSlot._id,
    appointmentDate: finalSelectedDate,
    reason: bookingReason.trim(),
    reportIds: selectedReportIds,
    couponCode: appliedCoupon?.code || "",
    allowTimeConflict: false,
  };

  try {
    await submitBooking(payload);
  } catch (err) {
    toast.error(err || "Failed to initiate appointment");
  }
};

const handleProceedAfterTimeConflict = async () => {
  if (!pendingBookingPayload) {
    setTimeConflictWarning(null);
    return;
  }

  try {
    await submitBooking({
      ...pendingBookingPayload,
      allowTimeConflict: true,
    });

    setTimeConflictWarning(null);
    setPendingBookingPayload(null);
  } catch (err) {
    toast.error(err || "Failed to initiate appointment");
  }
};

const handleCancelTimeConflict = () => {
  setTimeConflictWarning(null);
  setPendingBookingPayload(null);
};

  return (
    <PatientLayout>
      <main className="mx-auto max-w-[1040px] px-6 py-10">
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

          <p className="mt-3 max-w-[720px] text-base leading-7 text-[#6B7280]">
            Review doctor details, confirm the selected slot, add reason for
            booking, and upload previous medical reports if available.
          </p>
        </section>

        {isLoadingDetails ? (
          <div className="mt-8 rounded-3xl bg-[#F8FAFC] p-10 text-sm font-bold text-[#6B7280]">
            Loading booking details...
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
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
                onCrop={() => setIsReportCropOpen(true)}
                onRemoveFile={handleRemoveReportFile}
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
                  value={formatDateLong(finalSelectedDate)}
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

                  <CouponApplyBox
                    couponCode={couponCode}
                    setCouponCode={setCouponCode}
                    appliedCoupon={appliedCoupon}
                    availableCoupons={availableCoupons}
                    isLoadingCoupons={isLoadingCoupons}
                    isValidating={isValidating}
                    onApply={handleApplyCoupon}
                    onRemove={handleRemoveCoupon}
                  />

                  <div className="mt-4 space-y-3 border-t border-[#EEF0F6] pt-4">
                    <SummaryRow
                      label="Coupon Discount"
                      value={`₹${couponDiscount}`}
                    />

                    <SummaryRow
                      label="Referral Discount"
                      value={`₹${referralDiscount}`}
                    />

                    <SummaryRow
                      label="Total Discount"
                      value={`₹${totalDiscount}`}
                    />

                    <SummaryRow
                      label="Payable Amount"
                      value={`₹${payableAmount}`}
                      highlight
                    />
                  </div>

                  {canShowReferralDiscountPreview && referralDiscount > 0 && (
  <p className="mt-3 rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700">
    Referral discount will be applied to this first payment.
  </p>
)}

{myReferral?.refereeBenefit?.hasUsedDiscount && (
  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
    Referral discount was already used on your first successful payment.
  </p>
)}
                </div>
              </div>

             <Button
        type="button"
        loading={isInitiating}
         disabled={isInitiating}
        onClick={handleContinueToPayment}
        className="mt-6"
          >
  {selectedSlot?.isReservedByMe ? "Continue Existing Payment" : "Continue to Payment"}
</Button>

              <p className="mt-3 text-xs leading-5 text-[#9CA3AF]">
                Your selected slot will be reserved temporarily. Complete
                payment within 10 minutes to confirm the booking request.
              </p>
            </aside>
          </div>
        )}
      </main>

      <ImageCropperModal
        open={isReportCropOpen}
        imageSrc={cropSourceUrl}
        fileName={reportForm.file?.name || "cropped-report.jpg"}
        aspect={4 / 3}
        cropShape="rect"
        title="Crop Report Image"
        description="Crop the uploaded report image before attaching it to your appointment."
        onCancel={handleCancelReportCrop}
        onCropComplete={handleReportCropComplete}
      />

      <TimeConflictWarningModal
  open={Boolean(timeConflictWarning)}
  warning={timeConflictWarning}
  loading={isInitiating}
  onCancel={handleCancelTimeConflict}
  onProceed={handleProceedAfterTimeConflict}
/>

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
  onCrop,
  onRemoveFile,
}) {
  const fileIsImage = isImageFile(reportForm.file);

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
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Paperclip size={18} className="shrink-0 text-[#9381FF]" />

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#111827]">
                    {reportForm.file.name}
                  </p>

                  <p className="text-xs text-[#6B7280]">
                    {(reportForm.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                {fileIsImage && (
                  <button
                    type="button"
                    onClick={onCrop}
                    className="inline-flex h-9 items-center gap-1 rounded-xl bg-[#F0F1FF] px-3 text-xs font-extrabold text-[#9381FF] transition hover:bg-[#E5E2FF]"
                  >
                    <Crop size={14} />
                    Crop
                  </button>
                )}

                <button
                  type="button"
                  onClick={onRemoveFile}
                  className="inline-flex h-9 items-center gap-1 rounded-xl bg-red-50 px-3 text-xs font-extrabold text-red-500 transition hover:bg-red-100"
                >
                  <X size={14} />
                  Remove
                </button>
              </div>
            </div>

            {localPreviewUrl && (
              <img
                src={localPreviewUrl}
                alt="Report preview"
                className="mt-4 h-48 w-full rounded-2xl object-cover"
              />
            )}

            {!fileIsImage && (
              <div className="mt-4 rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4 text-sm font-semibold text-[#6B7280]">
                PDF selected. Cropping is only available for image reports.
              </div>
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

function UploadedReportsCard({ reports, isLoading, isDeleting, onDelete }) {
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
            These reports will be attached to your appointment.
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
                  href={report.file?.url || report.fileUrl}
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

function SummaryRow({ label, value, strong = false, highlight = false }) {
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

function CouponApplyBox({
  couponCode,
  setCouponCode,
  appliedCoupon,
  availableCoupons,
  isLoadingCoupons,
  isValidating,
  onApply,
  onRemove,
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4">
      <p className="text-sm font-extrabold text-[#111827]">Apply Coupon</p>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
          disabled={Boolean(appliedCoupon)}
          placeholder="Enter coupon code"
          className="h-11 flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-bold uppercase outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10 disabled:bg-slate-100"
        />

        {appliedCoupon ? (
          <button
            type="button"
            onClick={onRemove}
            className="h-11 rounded-xl bg-red-50 px-4 text-xs font-extrabold text-red-600 transition hover:bg-red-100"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={isValidating}
            className="h-11 rounded-xl bg-[#9381FF] px-4 text-xs font-extrabold text-white transition hover:bg-[#7E6EF2] disabled:opacity-60"
          >
            {isValidating ? "Applying..." : "Apply"}
          </button>
        )}
      </div>

      {appliedCoupon && (
        <div className="mt-3 rounded-xl bg-green-50 p-3 text-xs font-bold text-green-700">
          {appliedCoupon.code} applied successfully
        </div>
      )}

      {!appliedCoupon && availableCoupons?.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase text-[#9CA3AF]">
            Available coupons
          </p>

          {availableCoupons.slice(0, 3).map((coupon) => (
            <button
              key={coupon._id}
              type="button"
              disabled={!coupon.isUserEligible}
              onClick={() => setCouponCode(coupon.code)}
              className="w-full rounded-xl border border-[#E5E7EB] bg-white p-3 text-left text-xs transition hover:border-[#9381FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-extrabold text-[#111827]">
                  {coupon.code}
                </span>

                <span className="font-extrabold text-green-600">
                  Save ₹{coupon.discountPreview || 0}
                </span>
              </div>

              <p className="mt-1 text-[#6B7280]">{coupon.title}</p>
            </button>
          ))}
        </div>
      )}
     {!appliedCoupon &&
  !isLoadingCoupons &&
  (!availableCoupons || availableCoupons.length === 0) && (
    <div className="mt-4 rounded-xl border border-dashed border-[#D1D5DB] bg-white p-3">
      <p className="text-xs font-extrabold uppercase text-[#9CA3AF]">
        No coupons available
      </p>

      <p className="mt-1 text-xs leading-5 text-[#6B7280]">
        There are no active coupons for this doctor or specialty right now.
        You can still continue booking normally.
      </p>
    </div>
  )}
      {isLoadingCoupons && (
        <p className="mt-3 text-xs font-bold text-[#6B7280]">
          Loading coupons...
        </p>
      )}
    </div>
  );
}
function TimeConflictWarningModal({
  open,
  warning,
  loading = false,
  onCancel,
  onProceed,
}) {
  if (!open) return null;

  const conflict = warning?.conflictAppointment;
  const doctor = conflict?.doctor;

  const doctorName = doctor
    ? `Dr. ${[doctor.firstName, doctor.lastName].filter(Boolean).join(" ")}`
    : "another doctor";

  const specialty =
    doctor?.specialization?.displayName ||
    doctor?.specialization?.name ||
    "Dental Specialist";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[500px] rounded-3xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.25)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
            <AlertTriangle size={24} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-[#111827]">
              Same Time Appointment Warning
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              {warning?.message ||
                "You already have another appointment at this time. Do you want to proceed?"}
            </p>
          </div>
        </div>

        {conflict && (
          <div className="mt-5 rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.6px] text-orange-600">
              Existing appointment
            </p>

            <p className="mt-2 text-sm font-extrabold text-[#111827]">
              {doctorName}
            </p>

            <p className="mt-1 text-xs font-bold text-[#6B7280]">
              {specialty}
            </p>

            <p className="mt-3 text-sm font-bold text-orange-700">
              {formatDateLong(conflict.appointmentDate)} ·{" "}
              {formatTime(conflict.startTime)} – {formatTime(conflict.endTime)}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-2xl px-5 text-sm font-extrabold text-[#6B7280] transition hover:bg-slate-100 disabled:opacity-60"
          >
            Cancel
          </button>

          <Button
            type="button"
            loading={loading}
            disabled={loading}
            onClick={onProceed}
            fullWidth={false}
            className="min-w-[160px]"
          >
            Proceed Anyway
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookAppointmentPage;