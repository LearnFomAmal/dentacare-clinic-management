import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

import PatientLayout from "../../components/patient/PatientLayout";
import { ROUTES } from "../../constants/routes";

function PaymentFailedPage() {
  return (
    <PatientLayout>
      <main className="mx-auto flex min-h-[calc(100vh-78px)] max-w-[560px] items-center px-6 py-10">
        <section className="w-full rounded-3xl border border-[#EEF0F6] bg-white p-8 text-center shadow-[0_24px_64px_rgba(17,24,39,0.08)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={30} />
          </div>

          <h1 className="mt-6 text-3xl font-extrabold text-[#111827]">
            Payment Failed
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Your payment was not completed. The temporary appointment has been
            removed and the slot has been released.
          </p>

          <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm font-bold leading-6 text-red-700">
            Please go back to the doctor page, select an available slot again,
            and start a new booking.
          </p>

          <Link
            to={ROUTES.FIND_DOCTORS}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2]"
          >
            Book Again
          </Link>

          <Link
            to={ROUTES.MY_APPOINTMENTS}
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-red-200 text-sm font-extrabold text-red-600 transition hover:bg-red-50"
          >
            Back to Appointments
          </Link>
        </section>
      </main>
    </PatientLayout>
  );
}

export default PaymentFailedPage;