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
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PatientLayout from "../../components/patient/PatientLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearAppointmentError,
  fetchAppointmentDetails,
  setSelectedPaymentMethod,
} from "../../features/appointment/appointmentSlice";

const paymentMethods = [
  {
    id: "google_pay",
    title: "Google Pay",
    subtitle: "Recommended fast payment",
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

const formatDate = (dateString) => {
  if (!dateString) return "Not available";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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

function PaymentPage() {
  const { appointmentId } = useParams();
  const dispatch = useAppDispatch();

  const {
  initiatedAppointment,
  selectedPaymentMethod,
  isLoadingDetails,
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

  const doctor =
    typeof appointment?.doctorId === "object"
      ? appointment.doctorId
      : null;

  const doctorName =
    doctor
      ? [doctor.firstName, doctor.lastName].filter(Boolean).join(" ")
      : "Doctor";

  const specialty =
    doctor?.specialization?.displayName ||
    doctor?.specialization?.name ||
    "Dental Specialist";

  const totalAmount = appointment?.pricing?.finalAmount || 0;
  const walletBalance = 0;

  const handleMockSuccessPayment = () => {
    toast.success(
      "Mock payment success. Real payment success API will be connected in Day 5."
    );
  };

  const handleMockFailedPayment = () => {
    toast.error(
      "Mock payment failed. Failed payment API/page will be connected in Day 5."
    );
  };

  return (
    <PatientLayout>
      <main className="mx-auto max-w-[560px] px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to={ROUTES_SAFE_BACK}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#6B7280] shadow-[0_8px_24px_rgba(17,24,39,0.05)] transition hover:text-[#9381FF]"
          >
            <ArrowLeft size={16} />
            Back to appointment
          </Link>
        </div>

        <section className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_24px_64px_rgba(17,24,39,0.08)]">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
            <ShieldCheck size={24} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[1px] text-[#9381FF]">
            Mock payment flow
          </p>

          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.7px] text-[#111827]">
            Secure Payment Gateway
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Review your appointment details and simulate a successful or failed
            payment in this prototype flow.
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
              <AppointmentSummaryCard
                doctorName={doctorName}
                specialty={specialty}
                appointment={appointment}
                totalAmount={totalAmount}
                walletBalance={walletBalance}
              />

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
                onClick={handleMockSuccessPayment}
                className="mt-4 h-12 w-full rounded-2xl bg-green-50 text-sm font-extrabold text-green-700 transition hover:bg-green-100"
              >
                Payment
              </button>

              <button
                type="button"
                onClick={handleMockFailedPayment}
                className="mt-3 h-12 w-full rounded-2xl bg-red-50 text-sm font-extrabold text-red-600 transition hover:bg-red-100"
              >
                Cancel
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-[#9CA3AF]">
                This is a UI-only mock payment gateway for appointment booking.
                No real payment will be processed.
              </p>
            </>
          )}
        </section>
      </main>
    </PatientLayout>
  );
}

const ROUTES_SAFE_BACK = "/doctors";

function AppointmentSummaryCard({
  doctorName,
  specialty,
  appointment,
  totalAmount,
  walletBalance,
}) {
  return (
    <section className="mt-6 rounded-3xl bg-[#F8FAFC] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.7px] text-[#9CA3AF]">
            Appointment summary
          </p>

          <h2 className="mt-1 text-lg font-extrabold text-[#111827]">
            Appointment with Dr. {doctorName}
          </h2>
        </div>

        <span className="rounded-full bg-[#F3EFFF] px-3 py-1 text-xs font-extrabold text-[#9381FF]">
          Confirmed Slot
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryBox
          label="Date"
          value={formatDate(appointment.appointmentDate)}
          icon={CalendarDays}
        />

        <SummaryBox
          label="Time"
          value={`${formatTime(appointment.startTime)} – ${formatTime(
            appointment.endTime
          )}`}
          icon={CalendarDays}
        />

        <SummaryBox
          label="Specialty"
          value={specialty}
          icon={ShieldCheck}
        />

        <SummaryBox
          label="Clinic Fee"
          value={`₹${appointment.pricing?.consultationFee || 0}`}
          icon={IndianRupee}
        />
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-white p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.7px] text-[#9CA3AF]">
            Total to pay
          </p>

          <p className="mt-1 flex items-center text-3xl font-extrabold text-[#111827]">
            <IndianRupee size={26} />
            {totalAmount}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F0F1FF] px-4 py-3 text-right">
          <p className="text-xs font-bold text-[#9381FF]">
            Wallet Balance
          </p>

          <p className="mt-1 font-extrabold text-[#111827]">
            ₹{walletBalance}
          </p>
        </div>
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