import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PatientLayout from "../../components/patient/PatientLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { ROUTES } from "../../constants/routes";

import {
  confirmPaymentFailed,
  confirmPaymentSuccess,
  createRazorpayOrder,
  fetchAppointmentDetails,
  setSelectedPaymentMethod,
  verifyRazorpayPayment,
} from "../../features/appointment/appointmentSlice";

import { fetchMyWallet } from "../../features/wallet/walletSlice";

import {
  formatAppointmentDate,
  formatAppointmentTime,
  generateTransactionId,
  getDoctorName,
  getSpecialtyName,
} from "../../utils/appointmentUi";

const paymentMethods = [
  {
    id: "razorpay",
    title: "Razorpay Test",
    subtitle: "Cards, UPI, wallets in Razorpay test mode",
    icon: CreditCard,
  },
  {
    id: "wallet",
    title: "Wallet",
    subtitle: "Pay using DentaCare wallet",
    icon: Wallet,
  },
];

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

function PaymentPage() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const paymentFailureRecordedRef = useRef(false);

  const {
    initiatedAppointment,
    selectedPaymentMethod,
    isLoadingDetails,
    isPaying,
    isCreatingRazorpayOrder,
  } = useAppSelector((state) => state.appointments);

  const { wallet, isLoadingWallet } = useAppSelector((state) => state.wallet);

  useEffect(() => {
    dispatch(setSelectedPaymentMethod("razorpay"));

    if (appointmentId) {
      dispatch(fetchAppointmentDetails(appointmentId));
    }

    dispatch(fetchMyWallet());
  }, [dispatch, appointmentId]);

  const appointment = initiatedAppointment;

  const canPayAppointment =
    appointment?.status === "pending_payment" &&
    appointment?.paymentStatus === "unpaid";

  const finalAmount = appointment?.pricing?.finalAmount || 0;
  const walletBalance = wallet?.balance || 0;

  const isWalletPayment = selectedPaymentMethod === "wallet";
  const isWalletInsufficient = isWalletPayment && walletBalance < finalAmount;

  const goToPaymentFailedPage = () => {
    navigate(`/payment-failed/${appointmentId}`, {
      replace: true,
    });
  };

  const recordFailedPayment = async (
    failureReason = "Payment cancelled by patient"
  ) => {
    if (!appointment?._id) {
      goToPaymentFailedPage();
      return;
    }

    if (paymentFailureRecordedRef.current) {
      return;
    }

    paymentFailureRecordedRef.current = true;

    try {
      await dispatch(
        confirmPaymentFailed({
          appointmentId: appointment._id,
          paymentMethod: selectedPaymentMethod || "razorpay",
          transactionId: generateTransactionId(),
          failureReason,
        })
      ).unwrap();

      goToPaymentFailedPage();
    } catch (err) {
      toast.error(err || "Failed to record payment failure");
      goToPaymentFailedPage();
    }
  };

  const handleWalletPayment = async () => {
    if (!appointment?._id) {
      toast.error("Appointment not found");
      return;
    }

    if (!canPayAppointment) {
      toast.error("This appointment cannot be paid now");
      return;
    }

    if (isWalletInsufficient) {
      toast.error("Insufficient wallet balance");
      return;
    }

    try {
      const result = await dispatch(
        confirmPaymentSuccess({
          appointmentId: appointment._id,
          paymentMethod: "wallet",
          transactionId: generateTransactionId(),
        })
      ).unwrap();

      toast.success(result.message || "Payment successful");
      dispatch(fetchMyWallet());

      navigate(`/payment-success/${appointment._id}`, {
        replace: true,
      });
    } catch (err) {
      toast.error(err || "Payment failed");
    }
  };

  const handleRazorpayPayment = async () => {
    if (isPaying || isCreatingRazorpayOrder) return;

    if (!appointment?._id) {
      toast.error("Appointment not found");
      return;
    }

    if (!canPayAppointment) {
      toast.error("This appointment cannot be paid now");
      return;
    }

    const loaded = await loadRazorpayScript();

    if (!loaded) {
      toast.error("Failed to load Razorpay checkout");
      return;
    }

    try {
      const orderResult = await dispatch(
        createRazorpayOrder({
          appointmentId: appointment._id,
        })
      ).unwrap();

      const order = orderResult.order;

      const options = {
        key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: order.name || "DentaCare",
        description:
          order.description || "Dental appointment consultation fee",
        order_id: order.orderId,

        handler: async (response) => {
          try {
            const verifyResult = await dispatch(
  verifyRazorpayPayment({
  appointmentId: appointment._id,
  razorpay_order_id: response.razorpay_order_id,
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_signature: response.razorpay_signature,
})
            ).unwrap();

            toast.success(
              verifyResult.message || "Payment verified successfully"
            );

            navigate(`/payment-success/${appointment._id}`, {
              replace: true,
            });
          } catch (err) {
            toast.error(err || "Payment verification failed");
            await recordFailedPayment("Payment verification failed");
          }
        },

        prefill: {
          name: appointment.patientId?.username || "",
          email: appointment.patientId?.email || "",
          contact: appointment.patientId?.personalInfo?.phoneNumber || "",
        },

        theme: {
          color: "#9381FF",
        },

        modal: {
          ondismiss: () => {
            recordFailedPayment("Razorpay checkout closed by patient");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", async (response) => {
        await recordFailedPayment(
          response?.error?.description || "Razorpay payment failed"
        );
      });

      razorpay.open();
    } catch (err) {
      toast.error(err || "Failed to start Razorpay payment");
    }
  };

  const handlePrimaryPayment = () => {
    if (selectedPaymentMethod === "wallet") {
      handleWalletPayment();
      return;
    }

    handleRazorpayPayment();
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
            Complete payment to submit your appointment request to the doctor.
          </p>

          {isLoadingDetails ? (
            <div className="mt-6 rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280]">
              Loading payment details...
            </div>
          ) : !appointment ? (
            <div className="mt-6 rounded-2xl bg-red-50 p-6 text-sm font-bold text-red-600">
              Appointment details not found. Please book again.
            </div>
          ) : (
            <>
              <AppointmentSummary appointment={appointment} />

              {!canPayAppointment && (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 text-red-700">
                  <p className="text-sm font-extrabold">
                    Payment not available
                  </p>

                  <p className="mt-1 text-xs font-bold leading-5">
                    This appointment is not waiting for payment. Please book
                    again from the doctor page.
                  </p>
                </div>
              )}

              {canPayAppointment && (
                <>
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

                  {selectedPaymentMethod === "razorpay" && (
                    <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-blue-700">
                      <p className="text-sm font-extrabold">
                        Razorpay Test Mode
                      </p>

                      <p className="mt-1 text-xs font-bold leading-5">
                        Use Razorpay test cards/UPI from your Razorpay
                        dashboard. No real payment should be collected while
                        using test keys.
                      </p>
                    </div>
                  )}

                  {isWalletPayment && (
                    <div
                      className={`mt-5 rounded-2xl p-4 ${
                        isWalletInsufficient
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      <p className="text-sm font-extrabold">
                        Wallet Balance:{" "}
                        {isLoadingWallet ? "Loading..." : `₹${walletBalance}`}
                      </p>

                      <p className="mt-1 text-xs font-bold">
                        {isWalletInsufficient
                          ? "Your wallet balance is not enough for this payment."
                          : "Your wallet has enough balance for this payment."}
                      </p>

                      {isWalletInsufficient && (
                        <Link
                          to={ROUTES.WALLET}
                          className="mt-3 inline-flex text-xs font-extrabold underline"
                        >
                          Add money to wallet
                        </Link>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePrimaryPayment}
                    disabled={
  !canPayAppointment ||
  isPaying ||
  isCreatingRazorpayOrder ||
  isWalletInsufficient
}
                    className="mt-6 h-12 w-full rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPaying || isCreatingRazorpayOrder
                      ? "Processing..."
                      : selectedPaymentMethod === "wallet"
                        ? "Pay with Wallet"
                        : "Pay with Razorpay"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      recordFailedPayment("Payment cancelled by patient")
                    }
                    disabled={isPaying || isCreatingRazorpayOrder}
                    className="mt-3 h-12 w-full rounded-2xl bg-red-50 text-sm font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel Payment
                  </button>
                </>
              )}
            </>
          )}
        </section>
      </main>
    </PatientLayout>
  );
}

function AppointmentSummary({ appointment }) {
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
            {new Date(
              appointment.reservation.reservedUntil
            ).toLocaleTimeString([], {
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