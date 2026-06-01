import { useEffect } from "react";
import {
  ArrowLeft,
  CalendarDays,
  IndianRupee,
  Landmark,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PatientLayout from "../../components/patient/PatientLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { ROUTES } from "../../constants/routes";
import {
  clearAppointmentError,
  confirmPaymentFailed,
  confirmPaymentSuccess,
  fetchAppointmentDetails,
  setSelectedPaymentMethod,
} from "../../features/appointment/appointmentSlice";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  generateTransactionId,
  getDoctorName,
  getSpecialtyName,
} from "../../utils/appointmentUi";

const paymentMethods = [
  {
    id: "google_pay",
    title: "Google Pay",
    subtitle: "Fast payment simulation",
    icon: Smartphone,
  },
  {
    id: "phonepe",
    title: "PhonePe",
    subtitle: "UPI instant route",
    icon: Smartphone,
  },
  {
    id: "upi",
    title: "UPI",
    subtitle: "Pay with any UPI app",
    icon: Landmark,
  },
  {
    id: "wallet",
    title: "Wallet",
    subtitle: "DentaCare wallet balance",
    icon: Wallet,
  },
];

function PaymentPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    initiatedAppointment,
    selectedPaymentMethod,
    isLoadingDetails,
    isPaying,
    error,
  } = useAppSelector((state) => state.appointments);

  useEffect(() => {
    if (appointmentId) {
      dispatch(fetchAppointmentDetails(appointmentId));
    }
  }, [dispatch, appointmentId]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearAppointmentError());
  }, [error, dispatch]);

  const appointment = initiatedAppointment;

  const handleSuccessPayment = async () => {
    if (!appointment?._id) {
      toast.error("Appointment not found");
      return;
    }

    try {
      const result = await dispatch(
        confirmPaymentSuccess({
          appointmentId: appointment._id,
          paymentMethod: selectedPaymentMethod,
          transactionId: generateTransactionId(),
        })
      ).unwrap();

      toast.success(result.message || "Payment successful");

      navigate(`/payment-success/${appointment._id}`, {
        replace: true,
      });
    } catch (err) {
      toast.error(err || "Payment failed");
    }
  };

  const handleFailedPayment = async () => {
    if (!appointment?._id) {
      toast.error("Appointment not found");
      return;
    }

    try {
      const result = await dispatch(
        confirmPaymentFailed({
          appointmentId: appointment._id,
          paymentMethod: selectedPaymentMethod,
          transactionId: generateTransactionId(),
          failureReason: "Payment cancelled by patient",
        })
      ).unwrap();

      toast.error(result.message || "Payment failed");

      navigate(`/payment-failed/${appointment._id}`, {
        replace: true,
      });
    } catch (err) {
      toast.error(err || "Failed to record payment failure");
    }
  };

  return (
    <PatientLayout>
      <main className="mx-auto max-w-[620px] px-6 py-10">
        <Link
          to={ROUTES.FIND_DOCTORS}
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6B7280] shadow-[0_8px_24px_rgba(17,24,39,0.05)] transition hover:text-[#9381FF]"
        >
          <ArrowLeft size={16} />
          Back to doctors
        </Link>

        <section className="mt-6 rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_24px_64px_rgba(17,24,39,0.08)]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
            <ShieldCheck size={24} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[1px] text-[#9381FF]">
            Payment
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.7px] text-[#111827]">
            Confirm Your Payment
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            This week uses a simulated payment flow. Click Payment to mark the
            appointment as paid and send it for approval.
          </p>

          {isLoadingDetails ? (
            <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280]">
              Loading payment details...
            </div>
          ) : !appointment ? (
            <div className="mt-6 rounded-2xl bg-red-50 p-6 text-sm font-bold text-red-600">
              Appointment details not found.
            </div>
          ) : (
            <>
              <AppointmentSummary appointment={appointment} />

              <section className="mt-6">
                <h2 className="text-sm font-extrabold text-[#111827]">
                  Choose payment method
                </h2>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      active={selectedPaymentMethod === method.id}
                      onClick={() =>
                        dispatch(setSelectedPaymentMethod(method.id))
                      }
                    />
                  ))}
                </div>
              </section>

              <button
                type="button"
                onClick={handleSuccessPayment}
                disabled={isPaying}
                className="mt-6 h-12 w-full rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPaying ? "Processing..." : "Payment"}
              </button>

              <button
                type="button"
                onClick={handleFailedPayment}
                disabled={isPaying}
                className="mt-3 h-12 w-full rounded-2xl bg-red-50 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          )}
        </section>
      </main>
    </PatientLayout>
  );
}

function AppointmentSummary({ appointment }) {
  const totalAmount = appointment?.pricing?.finalAmount || 0;

  return (
    <section className="mt-6 rounded-3xl bg-[#F8FAFC] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.7px] text-[#9CA3AF]">
        Appointment summary
      </p>

      <h2 className="mt-1 text-lg font-extrabold text-[#111827]">
        Appointment with Dr. {getDoctorName(appointment)}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SummaryBox
          label="Date"
          value={formatAppointmentDate(appointment.appointmentDate)}
          icon={CalendarDays}
        />

        <SummaryBox
          label="Time"
          value={`${formatAppointmentTime(
            appointment.startTime
          )} – ${formatAppointmentTime(appointment.endTime)}`}
          icon={CalendarDays}
        />

        <SummaryBox
          label="Specialty"
          value={getSpecialtyName(appointment)}
          icon={ShieldCheck}
        />

        <SummaryBox
          label="Clinic Fee"
          value={`₹${appointment.pricing?.consultationFee || 0}`}
          icon={IndianRupee}
        />
      </div>

     <div className="mt-5 rounded-2xl bg-white p-4">
  <SummaryPriceRow
    label="Consultation Fee"
    value={appointment.pricing?.consultationFee || 0}
  />

  <SummaryPriceRow
    label="Coupon Discount"
    value={appointment.pricing?.couponDiscount || 0}
    discount
  />
 
 <SummaryPriceRow
  label="Referral Discount"
  value={appointment.pricing?.referralDiscount || 0}
  discount
/>

  <SummaryPriceRow
    label="Total Discount"
    value={appointment.pricing?.totalDiscount || 0}
    discount
  />
  
  
  <div className="mt-3 border-t border-[#EEF0F6] pt-3">
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold uppercase tracking-[0.7px] text-[#9CA3AF]">
        Total to pay
      </p>

      <p className="flex items-center text-3xl font-extrabold text-[#111827]">
        <IndianRupee size={26} />
        {appointment.pricing?.finalAmount || 0}
      </p>
    </div>
  </div>

  {appointment.reservation?.reservedUntil && (
    <p className="mt-3 rounded-xl bg-orange-50 p-3 text-xs font-bold text-orange-600">
      Complete payment before{" "}
      {new Date(appointment.reservation.reservedUntil).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </p>
  )}
</div>
    </section>
  );
}

function SummaryBox({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF]">
        <Icon size={15} />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-[#111827]">
        {value}
      </p>
    </div>
  );
}
function SummaryPriceRow({ label, value, discount = false }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="font-bold text-[#6B7280]">{label}</span>

      <span
        className={`flex items-center font-extrabold ${
          discount ? "text-green-600" : "text-[#111827]"
        }`}
      >
        {discount && value > 0 ? "- " : ""}
        ₹{value}
      </span>
    </div>
  );
}
function PaymentMethodCard({ method, active, onClick }) {
  const Icon = method.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-[#9381FF] bg-[#F8F7FF]"
          : "border-[#EEF0F6] bg-white hover:border-[#B8B8FF]"
      }`}
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF]">
        <Icon size={17} />
      </div>

      <h3 className="text-sm font-extrabold text-[#111827]">
        {method.title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-[#6B7280]">
        {method.subtitle}
      </p>
    </button>
  );
}

export default PaymentPage;