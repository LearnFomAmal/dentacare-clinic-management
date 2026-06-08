import { useEffect, useState } from "react";
import {
  CalendarDays,
  IndianRupee,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { getMyDoctorEarningsApi } from "../../features/earnings/earningService";

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

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
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

function DoctorEarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = async () => {
    try {
      setIsLoading(true);

      const response = await getMyDoctorEarningsApi({
        page: 1,
        limit: 20,
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
    fetchEarnings();
  }, []);

  const summary = earnings?.summary || {
    todayEarned: 0,
    monthlyEarned: 0,
    totalEarned: 0,
    totalTransactions: 0,
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
            value={isLoading ? "..." : `₹${summary.todayEarned || 0}`}
            icon={IndianRupee}
          />

          <EarningStatCard
            label="Monthly Income"
            value={isLoading ? "..." : `₹${summary.monthlyEarned || 0}`}
            icon={TrendingUp}
          />

          <EarningStatCard
            label="Total Earned"
            value={isLoading ? "..." : `₹${summary.totalEarned || 0}`}
            icon={Wallet}
          />

          <EarningStatCard
            label="Transactions"
            value={isLoading ? "..." : summary.totalTransactions || 0}
            icon={ReceiptText}
          />
        </section>

        <section className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-[#111827] dark:text-white">
              Transaction History
            </h2>

            <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
              Earnings are added only after an approved appointment is completed.
            </p>
          </div>

          {isLoading ? (
            <p className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280]">
              Loading earning transactions...
            </p>
          ) : earnings?.transactions?.length > 0 ? (
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
                  {earnings.transactions.map((transaction) => (
                    <DoctorEarningRow
                      key={transaction._id}
                      transaction={transaction}
                    />
                  ))}
                </tbody>
              </table>
            </div>
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
          ₹{transaction.totalDiscount || 0}
        </p>
      </td>

      <td className="px-4 py-5 text-right">
        <p className="text-lg font-extrabold text-[#111827] dark:text-white">
          ₹{transaction.earnedAmount || 0}
        </p>

        <span className="mt-1 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold capitalize text-green-700">
          {transaction.earningStatus || "earned"}
        </span>
      </td>
    </tr>
  );
}

export default DoctorEarningsPage;