import { Home, LogIn, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

import { ROUTES } from "../../constants/routes";
import { getAccountType, getAuthUser } from "../../utils/authStorage";

const getDashboardPath = () => {
  const accountType = getAccountType();
  const user = accountType ? getAuthUser(accountType) : null;

  if (!accountType || !user) {
    return null;
  }

  if (accountType === "admin") {
    return ROUTES.ADMIN_DASHBOARD;
  }

  if (accountType === "doctor") {
    const isProfessionallyVerified =
      user?.accountStatus?.isVerified === true &&
      user?.verification?.status === "approved";

    return isProfessionallyVerified
      ? ROUTES.DOCTOR_DASHBOARD
      : ROUTES.DOCTOR_SETTINGS;
  }

  return ROUTES.PATIENT_DASHBOARD;
};

function NotFoundPage() {
  const dashboardPath = getDashboardPath();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6 py-10">
      <section className="w-full max-w-[560px] rounded-[32px] border border-[#EEF0F6] bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-500">
          <SearchX size={30} />
        </div>

        <p className="mt-6 text-sm font-extrabold uppercase tracking-[1px] text-[#9381FF]">
          404 Page Not Found
        </p>

        <h1 className="mt-3 text-3xl font-black text-[#111827]">
          This page does not exist
        </h1>

        <p className="mt-3 text-sm font-semibold leading-7 text-[#6B7280]">
          The page you opened may be removed, renamed, or the URL may be wrong.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={ROUTES.HOME}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#9381FF] px-6 text-sm font-extrabold text-white transition hover:bg-[#7E6EF2]"
          >
            <Home size={17} />
            Go Home
          </Link>

          {dashboardPath ? (
            <Link
              to={dashboardPath}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#E5E7EB] px-6 text-sm font-extrabold text-[#374151] transition hover:border-[#9381FF] hover:text-[#9381FF]"
            >
              Go Dashboard
            </Link>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] px-6 text-sm font-extrabold text-[#374151] transition hover:border-[#9381FF] hover:text-[#9381FF]"
            >
              <LogIn size={17} />
              Login
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;