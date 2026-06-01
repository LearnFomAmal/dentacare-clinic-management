import { useEffect } from "react";
import { Check, IndianRupee } from "lucide-react";
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
  getDoctorName,
} from "../../utils/appointmentUi";

function PaymentSuccessPage() {
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
      <main className="mx-auto flex min-h-[calc(100vh-78px)] max-w-[560px] items-center px-6 py-10">
        <section className="w-full rounded-3xl border border-[#EEF0F6] bg-white p-8 text-center shadow-[0_24px_64px_rgba(17,24,39,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
            <Check size={30} />
          </div>

          <h1 className="mt-6 text-3xl font-extrabold text-[#111827]">
            Payment Successful!
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Your payment is completed. Your appointment is now pending approval.
          </p>

          {isLoadingDetails ? (
            <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-5 text-sm font-bold text-[#6B7280]">
              Loading details...
            </div>
          ) : appointment ? (
            <div className="mt-6 rounded-2xl border border-[#EEF0F6] p-5 text-left">
              <InfoRow
                label="Doctor"
                value={`Dr. ${getDoctorName(appointment)}`}
              />

              <InfoRow
                label="Date"
                value={formatAppointmentDate(appointment.appointmentDate)}
              />

              <InfoRow
                label="Time"
                value={`${formatAppointmentTime(
                  appointment.startTime
                )} – ${formatAppointmentTime(appointment.endTime)}`}
              />

              <InfoRow
                label="Amount Paid"
                value={`₹${appointment.pricing?.finalAmount || 0}`}
                highlight
              />

              <InfoRow
                label="Transaction ID"
                value={appointment.paymentSummary?.transactionId || "N/A"}
              />
            </div>
          ) : null}

          <Link
            to="/my-appointments"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2]"
          >
            View My Appointments
          </Link>
        </section>
      </main>
    </PatientLayout>
  );
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex justify-between border-b border-[#EEF0F6] py-3 last:border-0">
      <span className="text-sm font-medium text-[#6B7280]">{label}</span>

      <span
        className={`text-right text-sm font-extrabold ${
          highlight ? "flex items-center text-[#9381FF]" : "text-[#111827]"
        }`}
      >
        {highlight && <IndianRupee size={15} />}
        {highlight ? String(value).replace("₹", "") : value}
      </span>
    </div>
  );
}

export default PaymentSuccessPage;