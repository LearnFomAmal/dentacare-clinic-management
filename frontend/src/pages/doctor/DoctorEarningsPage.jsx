import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  ReceiptText,
  RefreshCcw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { getMyDoctorEarningsApi } from "../../features/earnings/earningService";

const EARNINGS_LIMIT = 10;

const formatDateTime = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAppointmentDate = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  });
};

const formatTime = (time) => {
  if (!time) return "";

  const [hourValue, minute] = String(time).split(":").map(Number);

  if (Number.isNaN(hourValue) || Number.isNaN(minute)) {
    return "";
  }

  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
};

const formatAmount = (value) => {
  return Number(value || 0).toLocaleString("en-IN");
};

function DoctorEarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchEarnings = async ({ pageNumber = page } = {}) => {
    try {
      setIsLoading(true);

      const response = await getMyDoctorEarningsApi({
        page: pageNumber,
        limit: EARNINGS_LIMIT,
      });

      setEarnings(response.data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch earnings";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings({
      pageNumber: page,
    });
  }, [page]);

  const summary = earnings?.summary || {
    todayEarned: 0,
    monthlyEarned: 0,
    totalEarned: 0,
    totalTransactions: 0,
  };

  const transactions = earnings?.transactions || [];

  const pagination = earnings?.pagination || {
    page,
    limit: EARNINGS_LIMIT,
    totalTransactions: 0,
    totalPages: 1,
  };

  const canGoPrevious = Number(pagination.page || page) > 1;

  const canGoNext =
    Number(pagination.page || page) < Number(pagination.totalPages || 1);

  const showingText = useMemo(() => {
    const total = Number(pagination.totalTransactions || 0);

    if (total === 0) {
      return "Showing 0 transactions";
    }

    const currentPage = Number(pagination.page || page);
    const limit = Number(pagination.limit || EARNINGS_LIMIT);

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);

    return `Showing ${start} - ${end} of ${total} transactions`;
  }, [pagination, page]);

  const handleRefresh = () => {
    fetchEarnings({
      pageNumber: page,
    });
  };

  const handlePreviousPage = () => {
    if (!canGoPrevious || isLoading) return;

    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (!canGoNext || isLoading) return;

    setPage((prev) => prev + 1);
  };

  return (
    <DashboardLayout
      title="Doctor Earnings"
      description="Track earnings from completed appointments."
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <EarningStatCard
            label="Today's Income"
            value={isLoading ? "..." : `₹${formatAmount(summary.todayEarned)}`}
            icon={IndianRupee}
          />

          <EarningStatCard
            label="Monthly Income"
            value={
              isLoading ? "..." : `₹${formatAmount(summary.monthlyEarned)}`
            }
            icon={TrendingUp}
          />

          <EarningStatCard
            label="Total Earned"
            value={isLoading ? "..." : `₹${formatAmount(summary.totalEarned)}`}
            icon={Wallet}
          />

          <EarningStatCard
            label="Transactions"
            value={
              isLoading
                ? "..."
                : Number(summary.totalTransactions || 0).toLocaleString(
                    "en-IN"
                  )
            }
            icon={ReceiptText}
          />
        </section>

        <section className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#111827] dark:text-white">
                Transaction History
              </h2>

              <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
                Earnings are added only after an approved appointment is
                completed.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#F8F7FF] px-5 text-sm font-extrabold text-[#9381FF] transition hover:bg-[#F0F1FF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280] dark:bg-slate-950 dark:text-slate-400">
              Loading earning transactions...
            </p>
          ) : transactions.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left">
                  <thead>
                    <tr className="border-b border-[#EEF0F6] text-xs uppercase tracking-[0.8px] text-[#9CA3AF] dark:border-slate-800">
                      <th className="px-4 py-4">Patient</th>
                      <th className="px-4 py-4">Appointment</th>
                      <th className="px-4 py-4">Transaction</th>
                      <th className="px-4 py-4">Payment</th>
                      <th className="px-4 py-4">Discount</th>
                      <th className="px-4 py-4 text-right">Earned</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => (
                      <DoctorEarningRow
                        key={transaction._id}
                        transaction={transaction}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                showingText={showingText}
                page={pagination.page || page}
                totalPages={pagination.totalPages || 1}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                isLoading={isLoading}
                onPrevious={handlePreviousPage}
                onNext={handleNextPage}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-10 text-center dark:border-slate-700 dark:bg-slate-950">
              <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
                No earning transactions found.
              </p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function EarningStatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
          {label}
        </p>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
          <Icon size={20} />
        </div>
      </div>

      <p className="mt-4 text-4xl font-extrabold text-[#111827] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function DoctorEarningRow({ transaction }) {
  const patientName =
    transaction.patient?.username || transaction.patient?.email || "Patient";

  const appointmentDate =
    transaction.appointment?.appointmentDate || transaction.appointmentDate;

  const startTime = transaction.appointment?.startTime || transaction.startTime;
  const endTime = transaction.appointment?.endTime || transaction.endTime;

  return (
    <tr className="border-b border-[#EEF0F6] last:border-0 dark:border-slate-800">
      <td className="px-4 py-5">
        <p className="text-sm font-extrabold text-[#111827] dark:text-white">
          {patientName}
        </p>

        <p className="mt-1 text-xs text-[#6B7280] dark:text-slate-400">
          {transaction.patient?.email || "No email"}
        </p>
      </td>

      <td className="px-4 py-5">
        <p className="flex items-center gap-2 text-sm font-bold text-[#374151] dark:text-slate-300">
          <CalendarDays size={15} className="text-[#9381FF]" />
          {formatAppointmentDate(appointmentDate)}
        </p>

        <p className="mt-1 text-xs text-[#6B7280] dark:text-slate-400">
          {formatTime(startTime)} - {formatTime(endTime)}
        </p>
      </td>

      <td className="px-4 py-5">
        <p className="break-all text-xs font-bold text-[#374151] dark:text-slate-300">
          {transaction.transactionId || "N/A"}
        </p>

        <p className="mt-1 text-xs text-[#6B7280] dark:text-slate-400">
          Earned at {formatDateTime(transaction.earnedAt)}
        </p>
      </td>

      <td className="px-4 py-5">
        <span className="rounded-full bg-[#F0F1FF] px-3 py-1 text-xs font-extrabold capitalize text-[#9381FF]">
          {String(transaction.paymentMethod || "N/A").replace("_", " ")}
        </span>
      </td>

      <td className="px-4 py-5">
        <p className="text-sm font-bold text-green-600">
          ₹{formatAmount(transaction.totalDiscount)}
        </p>
      </td>

      <td className="px-4 py-5 text-right">
        <p className="text-lg font-extrabold text-[#111827] dark:text-white">
          ₹{formatAmount(transaction.earnedAmount)}
        </p>

        <span className="mt-1 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold capitalize text-green-700">
          {transaction.earningStatus || "earned"}
        </span>
      </td>
    </tr>
  );
}

function PaginationControls({
  showingText,
  page,
  totalPages,
  canGoPrevious,
  canGoNext,
  isLoading,
  onPrevious,
  onNext,
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-[#EEF0F6] pt-5 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
      <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
        {showingText}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious || isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <span className="rounded-2xl bg-[#F8FAFC] px-4 py-2 text-sm font-extrabold text-[#111827] dark:bg-slate-950 dark:text-slate-100">
          Page {page} of {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-400"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default DoctorEarningsPage;