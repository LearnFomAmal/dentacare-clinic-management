import { useEffect } from "react";
import { ArrowLeft, CalendarDays, FileText, IndianRupee } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PatientLayout from "../../components/patient/PatientLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearAppointmentError,
  fetchMyAppointmentDetails,
} from "../../features/appointment/appointmentSlice";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  getCleanStatus,
  getDoctorName,
  getSpecialtyName,
  getStatusBadgeClass,
} from "../../utils/appointmentUi";

function MyAppointmentDetailsPage() {
  const { appointmentId } = useParams();
  const dispatch = useAppDispatch();

  const { selectedAppointment, isLoadingDetails, error } = useAppSelector(
    (state) => state.appointments
  );

  useEffect(() => {
    if (appointmentId) {
      dispatch(fetchMyAppointmentDetails(appointmentId));
    }
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  const appointment = selectedAppointment;

  return (
    <PatientLayout>
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
            Appointment not found.
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
              </div>

              <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
                <h2 className="text-xl font-extrabold text-[#111827]">
                  Reason for Visit
                </h2>

                <p className="mt-3 rounded-2xl bg-[#F8FAFC] p-5 text-sm leading-7 text-[#374151]">
                  {appointment.reason}
                </p>
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
  value={`₹${appointment.pricing?.finalAmount || 0}`}
  highlight
/>

<SummaryRow
  label="Coupon Code"
  value={appointment.pricing?.appliedCouponCode || "N/A"}
/>

<SummaryRow
  label="Payment Status"
  value={appointment.paymentStatus}
/>

<SummaryRow
  label="Transaction"
  value={appointment.paymentSummary?.transactionId || "N/A"}
/>
              </div>

              {appointment.status === "rejected" && (
                <div className="mt-6 rounded-2xl bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase text-red-500">
                    Rejected by {appointment.rejection?.rejectedBy}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-700">
                    {appointment.rejection?.reason}
                  </p>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    </PatientLayout>
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

export default MyAppointmentDetailsPage;