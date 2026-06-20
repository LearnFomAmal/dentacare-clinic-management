import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Gift,
  IndianRupee,
  XCircle,
  RefreshCcw,
  Star,
  MessageCircle,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import ReviewFormModal from "../../components/reviews/ReviewFormModal";
import DashboardLayout from "../../components/layout/DashboardLayout";
import CancelAppointmentModal from "../../components/appointments/CancelAppointmentModal";
import RescheduleAppointmentModal from "../../components/appointments/RescheduleAppointmentModal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearReviewError,
  createReview,
  fetchMyReviews,
} from "../../features/review/reviewSlice";
import {
  cancelMyAppointment,
  clearAppointmentError,
  fetchMyAppointmentDetails,
  rescheduleMyAppointment,
} from "../../features/appointment/appointmentSlice";

import {
  clearAppointmentReports,
  clearReportError,
  fetchPatientAppointmentReports,
} from "../../features/reports/reportSlice";

import {
  formatAppointmentDate,
  formatAppointmentTime,
  getCleanStatus,
  getDoctorName,
  getSpecialtyName,
  getStatusBadgeClass,
  isAppointmentEndTimePast,
  isAppointmentStartTimePast,
} from "../../utils/appointmentUi";
import { ROUTES } from "../../constants/routes";

const formatCompletedAt = (value) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function MyAppointmentDetailsPage() {
  const { appointmentId } = useParams();
  const dispatch = useAppDispatch();

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const {
    selectedAppointment,
    isLoadingDetails,
    isCancelling,
    isRescheduling,
    error,
  } = useAppSelector((state) => state.appointments);

  const {
    appointmentReports = [],
    isLoadingAppointmentReports,
    error: reportError,
  } = useAppSelector((state) => state.reports);
 
const {
  myReviews = [],
  isSaving: isSavingReview,
  error: reviewError,
} = useAppSelector((state) => state.reviews);

  useEffect(() => {
    if (!appointmentId) return;

    dispatch(fetchMyAppointmentDetails(appointmentId));
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!appointmentId) return;

    dispatch(clearAppointmentReports());
    dispatch(fetchPatientAppointmentReports(appointmentId));
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!error) return;

    if (!isCancelling && !isRescheduling) {
      toast.error(error);
    }

    dispatch(clearAppointmentError());
  }, [error, dispatch, isCancelling, isRescheduling]);

  useEffect(() => {
    if (!reportError) return;

    toast.error(reportError);
    dispatch(clearReportError());
  }, [reportError, dispatch]);
 
  useEffect(() => {
  dispatch(
  fetchMyReviews({
  page: 1,
  limit: 20,
})
  );
}, [dispatch]);

useEffect(() => {
  if (!reviewError) return;

  toast.error(reviewError);
  dispatch(clearReviewError());
}, [reviewError, dispatch]);

  const appointment = selectedAppointment;
const existingReview = myReviews.find((review) => {
  const reviewAppointmentId =
    typeof review.appointmentId === "string"
      ? review.appointmentId
      : review.appointmentId?._id;

  return String(reviewAppointmentId) === String(appointmentId);
});

const canReviewAppointment =
  appointment?.status === "completed" &&
  appointment?.paymentStatus === "paid" &&
  !existingReview;

  const handleCancelAppointment = async ({ reasonType, reason }) => {
    if (!reason.trim()) {
      toast.error("Cancellation reason is required");
      return;
    }

    try {
      const result = await dispatch(
        cancelMyAppointment({
          appointmentId,
          reasonType,
          reason,
        })
      ).unwrap();

      toast.success(result.message || "Appointment cancelled");
      setCancelModalOpen(false);

      dispatch(fetchMyAppointmentDetails(appointmentId));
      dispatch(fetchPatientAppointmentReports(appointmentId));
    } catch (err) {
      toast.error(err || "Failed to cancel appointment");
    }
  };

  const handleRescheduleAppointment = async ({
    newSlotDayId,
    newSlotId,
    newAppointmentDate,
    reasonType,
    reason,
  }) => {
    if (!reason.trim()) {
      toast.error("Reschedule reason is required");
      return;
    }

    try {
      const result = await dispatch(
        rescheduleMyAppointment({
          appointmentId,
          newSlotDayId,
          newSlotId,
          newAppointmentDate,
          reasonType,
          reason,
        })
      ).unwrap();

      toast.success(result.message || "Appointment rescheduled");
      setRescheduleModalOpen(false);

      dispatch(fetchMyAppointmentDetails(appointmentId));
    } catch (err) {
      toast.error(err || "Failed to reschedule appointment");
    }
  };

const isConsultationStarted = isAppointmentStartTimePast(appointment);
const isConsultationFinished = isAppointmentEndTimePast(appointment);

const isPaidActiveAppointment =
  ["pending", "approved"].includes(appointment?.status) &&
  appointment?.paymentStatus === "paid";

const isConsultationRunning =
  isPaidActiveAppointment &&
  isConsultationStarted &&
  !isConsultationFinished;

const isApprovedAwaitingDoctorCompletion =
  appointment?.status === "approved" &&
  appointment?.paymentStatus === "paid" &&
  isConsultationFinished;

const canCancel =
  isPaidActiveAppointment &&
  !isConsultationStarted;

const canReschedule =
  isPaidActiveAppointment &&
  !isConsultationStarted;
  const chatPath = appointment?._id
  ? ROUTES.APPOINTMENT_CHAT?.replace(":appointmentId", appointment._id) ||
    ROUTES.PATIENT_APPOINTMENT_CHAT?.replace(
      ":appointmentId",
      appointment._id
    ) ||
    `/appointments/${appointment._id}/chat`
  : "";

const canOpenChat =
  appointment?.status === "approved" &&
  appointment?.paymentStatus === "paid" &&
  Boolean(chatPath);
 const handleSubmitReview = async ({ rating, description }) => {
  if (!description.trim()) {
    toast.error("Review description is required");
    return;
  }

  try {
    const result = await dispatch(
      createReview({
        appointmentId,
        rating,
        description,
      })
    ).unwrap();

    toast.success(result.message || "Review submitted successfully");
    setReviewModalOpen(false);

    dispatch(
      fetchMyReviews({
  page: 1,
  limit: 20,
})
    );

    dispatch(fetchMyAppointmentDetails(appointmentId));

  } catch (err) {
    toast.error(err || "Failed to submit review");
  }
};
  return (
    <DashboardLayout showPageHeader={false}>
      <main className="mx-auto max-w-[1040px] px-6 py-10">
        <Link
          to="/my-appointments"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-[#9381FF]"
        >
          <ArrowLeft size={17} />
          Back to appointments
        </Link>

        {isLoadingDetails ? (
          <div className="mt-6 rounded-3xl bg-[#F8FAFC] p-10 text-sm font-bold text-[#6B7280]">
            Loading appointment details...
          </div>
        ) : !appointment ? (
          <div className="mt-6 rounded-3xl bg-red-50 p-10 text-sm font-bold text-red-600">
            Appointment not found. If payment failed, please book again from
            the doctor page.
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
                <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
                  Appointment details
                </p>

                <h1 className="mt-2 text-3xl font-extrabold text-[#111827]">
                  Dr. {getDoctorName(appointment)}
                </h1>

                <p className="mt-1 text-sm font-bold text-[#9381FF]">
                  {getSpecialtyName(appointment)}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <InfoBox
                    label="Date"
                    value={formatAppointmentDate(appointment.appointmentDate)}
                  />

                  <InfoBox
                    label="Time"
                    value={`${formatAppointmentTime(
                      appointment.startTime
                    )} – ${formatAppointmentTime(appointment.endTime)}`}
                  />

                  <InfoBox
                    label="Status"
                    value={getCleanStatus(appointment.status)}
                  />
                </div>

                {appointment.status === "completed" && (
                  <div className="mt-6 rounded-2xl bg-green-50 p-5">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-green-700">
                      <CheckCircle2 size={18} />
                      Appointment completed
                    </p>
                   
                    <p className="mt-2 text-xs font-bold text-green-600">
                      Completed at {formatCompletedAt(appointment.completedAt)}
                    </p>
                  </div>
                )}



                {appointment.status === "cancelled" && (
                  <div className="mt-6 rounded-2xl bg-slate-100 p-5">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-slate-700">
                      <XCircle size={18} />
                      Appointment cancelled
                    </p>

                    <p className="mt-2 text-xs font-bold text-slate-600">
                      Cancelled by{" "}
                      {appointment.cancellation?.cancelledBy || "N/A"}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {appointment.cancellation?.reason ||
                        "No reason provided"}
                    </p>

                    {appointment.paymentStatus === "refunded" && (
                      <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-xs font-extrabold text-green-700">
                        Refund credited to wallet.
                      </p>
                    )}
                   {appointment.status === "cancelled" &&
                         appointment.paymentStatus === "paid" &&
                          appointment.cancellation?.refundStatus === "not_refunded" && (
                          <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs font-extrabold text-red-700">
                              No refund issued. {appointment.cancellation?.refundPolicy}
                         </p>
                   )}
       
                  </div>
                )}

                {appointment.status === "expired" && (
                  <div className="mt-6 rounded-2xl bg-zinc-100 p-5">
                    <p className="flex items-center gap-2 text-sm font-extrabold text-zinc-700">
                      <XCircle size={18} />
                      Appointment expired
                    </p>

                    <p className="mt-2 text-xs font-bold text-zinc-600">
                      The appointment time passed before it was approved.
                    </p>

                    {appointment.paymentStatus === "refunded" && (
                      <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-xs font-extrabold text-green-700">
                        Refund credited to wallet.
                      </p>
                    )}
           </div>
                )}
              </div>

              <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
                <h2 className="text-xl font-extrabold text-[#111827]">
                  Reason for Visit
                </h2>

                <p className="mt-3 rounded-2xl bg-[#F8FAFC] p-5 text-sm leading-7 text-[#374151]">
                  {appointment.reason || "No reason provided"}
                </p>
              </div>

              {appointment.pricing?.referralDiscount > 0 && (
                <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
                      <Gift size={22} />
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-[#111827]">
                        Referral Benefit Applied
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                        You received ₹
                        {appointment.pricing?.referralDiscount || 0} discount
                        on this booking using a referral benefit.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {appointment.status === "completed" && (
                <PrescriptionViewSection
                  reports={appointmentReports}
                  isLoading={isLoadingAppointmentReports}
                />
              )}
            </section>

            <aside className="h-fit rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_18px_48px_rgba(17,24,39,0.06)]">
              <h2 className="text-xl font-extrabold text-[#111827]">
                Summary
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

              <div className="mt-6 space-y-4">
                <SummaryRow
                  label="Consultation Fee"
                  value={`₹${appointment.pricing?.consultationFee || 0}`}
                />

                <SummaryRow
                  label="Coupon Discount"
                  value={`₹${appointment.pricing?.couponDiscount || 0}`}
                />

                <SummaryRow
                  label="Referral Discount"
                  value={`₹${appointment.pricing?.referralDiscount || 0}`}
                />

                <SummaryRow
                  label="Reward Discount"
                  value={`₹${appointment.pricing?.rewardDiscount || 0}`}
                />

                <SummaryRow
                  label="Total Discount"
                  value={`₹${appointment.pricing?.totalDiscount || 0}`}
                />

                <SummaryRow
                  label="Paid Amount"
                  value={`₹${
                    appointment.paymentStatus === "paid"
                      ? appointment.pricing?.finalAmount || 0
                      : 0
                  }`}
                  highlight
                />

                <SummaryRow
                  label="Coupon Code"
                  value={appointment.pricing?.appliedCouponCode || "N/A"}
                />

                <SummaryRow
                  label="Payment Status"
                  value={appointment.paymentStatus || "N/A"}
                />

         <SummaryRow
  label="Refund Status"
  value={
    appointment.paymentStatus === "refunded"
      ? "Refunded to wallet"
      : appointment.cancellation?.refundStatus === "not_refunded"
        ? "Not refunded"
        : "N/A"
  }
/>

{appointment.cancellation?.refundPolicy && (
  <div className="rounded-2xl bg-[#F8FAFC] p-4">
    <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
      Refund Policy
    </p>

    <p className="mt-2 text-sm font-semibold leading-6 text-[#374151]">
      {appointment.cancellation.refundPolicy}
    </p>
  </div>
)}


                <SummaryRow
                  label="Completed At"
                  value={formatCompletedAt(appointment.completedAt)}
                />

                <SummaryRow
                  label="Transaction"
                  value={appointment.paymentSummary?.transactionId || "N/A"}
                />
              </div>
  {canOpenChat && (
  <Link
    to={chatPath}
    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(147,129,255,0.24)] transition hover:bg-[#7E6EF2]"
  >
    <MessageCircle size={17} />
    Chat with Doctor
  </Link>
)}
              {canCancel && (
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setCancelModalOpen(true)}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-50 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Appointment"}
                </button>
              )}

              {canReschedule && (
                <button
                  type="button"
                  disabled={isRescheduling}
                  onClick={() => setRescheduleModalOpen(true)}
                  className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F0F1FF] text-sm font-extrabold text-[#9381FF] transition hover:bg-[#E6E7FF] disabled:opacity-60"
                >
                  <RefreshCcw size={17} />
                  {isRescheduling ? "Rescheduling..." : "Reschedule Appointment"}
                </button>
              )}

     {isConsultationRunning && (
  <div className="mt-6 rounded-2xl bg-orange-50 p-4">
    <p className="text-xs font-bold uppercase text-orange-600">
      Consultation time started
    </p>

    <p className="mt-2 text-sm leading-6 text-orange-700">
      This appointment can no longer be cancelled or rescheduled because the
      consultation time has already started.
    </p>
  </div>
)}

{isApprovedAwaitingDoctorCompletion && (
  <div className="mt-6 rounded-2xl bg-blue-50 p-4">
    <p className="text-xs font-bold uppercase text-blue-600">
      Consultation time finished
    </p>

    <p className="mt-2 text-sm leading-6 text-blue-700">
      The consultation time is over. Please wait for the doctor to mark the
      appointment as completed and upload the prescription.
    </p>
  </div>
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
                    Cancelled by{" "}
                    {appointment.cancellation?.cancelledBy || "N/A"}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {appointment.cancellation?.reason || "No reason provided"}
                  </p>
                </div>
              )}

              {appointment.status === "expired" && (
                <div className="mt-6 rounded-2xl bg-zinc-100 p-4">
                  <p className="text-xs font-bold uppercase text-zinc-600">
                    Expired
                  </p>

                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    This appointment expired because the scheduled time passed
                    without approval.
                  </p>

                  {appointment.paymentStatus === "refunded" && (
                    <p className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-xs font-extrabold text-green-700">
                      Refund credited to wallet.
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
                    This appointment has been completed successfully.
                  </p>
                </div>
              )}

              {appointment.status === "completed" && (
  <div className="mt-6 rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-sm font-extrabold text-[#111827]">
          <Star size={18} className="text-[#F59E0B]" fill="currentColor" />
          Appointment Review
        </p>

        {existingReview ? (
          <p className="mt-2 text-xs font-bold capitalize text-[#6B7280]">
            Review submitted. Status: {existingReview.status}
          </p>
        ) : (
          <p className="mt-2 text-xs font-bold text-[#6B7280]">
            Share your experience with this doctor.
          </p>
        )}
      </div>

      {canReviewAppointment ? (
        <button
          type="button"
          onClick={() => setReviewModalOpen(true)}
          className="h-11 rounded-2xl bg-[#9381FF] px-5 text-sm font-extrabold text-white transition hover:bg-[#7E6EF2]"
        >
          Submit Review
        </button>
      ) : existingReview ? (
        <span
          className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${
            existingReview.status === "approved"
              ? "bg-green-100 text-green-700"
              : existingReview.status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-700"
          }`}
        >
          {existingReview.status}
        </span>
      ) : null}
    </div>

    {existingReview && (
      <div className="mt-4 rounded-2xl bg-white p-4">
        <div className="flex items-center gap-1 text-[#F59E0B]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={15}
              fill={
                index < Number(existingReview.rating)
                  ? "currentColor"
                  : "none"
              }
            />
          ))}
        </div>

        <p className="mt-3 text-sm leading-6 text-[#374151]">
          {existingReview.description}
        </p>

        {existingReview.status === "rejected" &&
          existingReview.rejectionReason && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
              Rejection reason: {existingReview.rejectionReason}
            </p>
          )}
      </div>
    )}
  </div>
)}

            </aside>
          </div>
        )}

        <CancelAppointmentModal
          open={cancelModalOpen}
          loading={isCancelling}
          actor="patient"
          appointment={appointment}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={handleCancelAppointment}
        />

        <RescheduleAppointmentModal
          open={rescheduleModalOpen}
          loading={isRescheduling}
          appointment={appointment}
          onClose={() => setRescheduleModalOpen(false)}
          onConfirm={handleRescheduleAppointment}
        />
        <ReviewFormModal
  open={reviewModalOpen}
  loading={isSavingReview}
  appointment={appointment}
  onClose={() => setReviewModalOpen(false)}
  onSubmit={handleSubmitReview}
/>
      </main>
    </DashboardLayout>
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

function ReportCard({ report }) {
  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF]">
        <FileText size={18} />
      </div>

      <p className="text-sm font-extrabold text-[#111827]">
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

function SummaryRow({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[#EEF0F6] pb-3 last:border-0">
      <span className="text-sm text-[#6B7280]">{label}</span>

      <span
        className={`text-right text-sm font-extrabold capitalize ${
          highlight ? "flex items-center text-[#9381FF]" : "text-[#111827]"
        }`}
      >
        {highlight && <IndianRupee size={14} />}
        {highlight ? String(value).replace("₹", "") : value}
      </span>
    </div>
  );
}

function PrescriptionViewSection({ reports = [], isLoading }) {
  const prescriptions = reports.filter(
    (report) => report.reportType === "prescription"
  );

  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <h2 className="text-xl font-extrabold text-[#111827]">
        Doctor Prescription
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#6B7280]">
        Prescription and treatment instructions uploaded by your doctor.
      </p>

      {isLoading ? (
        <p className="mt-5 rounded-2xl bg-[#F8FAFC] p-5 text-sm font-bold text-[#6B7280]">
          Loading prescription...
        </p>
      ) : prescriptions.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-6 text-center text-sm font-bold text-[#6B7280]">
          Prescription not uploaded yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {prescriptions.map((report) => (
            <PatientPrescriptionCard key={report._id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function PatientPrescriptionCard({ report }) {
  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF]">
        <FileText size={18} />
      </div>

      <h3 className="text-sm font-extrabold text-[#111827]">
        {report.title || "Prescription"}
      </h3>

      {report.prescriptionText && (
        <p className="mt-3 whitespace-pre-line rounded-2xl bg-white p-4 text-sm leading-7 text-[#374151]">
          {report.prescriptionText}
        </p>
      )}

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
  );
}

export default MyAppointmentDetailsPage;