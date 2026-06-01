import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  IndianRupee,
  Plus,
  RefreshCcw,
  WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearWalletError,
  fetchMyWallet,
  fetchWalletTransactions,
  topupWallet,
} from "../../features/wallet/walletSlice";
import { generateTransactionId } from "../../utils/appointmentUi";

const paymentMethods = [
  {
    label: "Google Pay",
    value: "google_pay",
  },
  {
    label: "PhonePe",
    value: "phonepe",
  },
  {
    label: "UPI",
    value: "upi",
  },
  {
    label: "Razorpay",
    value: "razorpay",
  },
];

function WalletPage() {
  const dispatch = useAppDispatch();

  const {
    wallet,
    transactions,
    isLoadingWallet,
    isLoadingTransactions,
    isToppingUp,
    error,
  } = useAppSelector((state) => state.wallet);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("google_pay");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMyWallet());
    dispatch(fetchWalletTransactions({ page: 1, limit: 20 }));
  }, [dispatch]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearWalletError());
  }, [error, dispatch]);

  const numericAmount = Number(amount || 0);

  const handleTopupClick = () => {
    if (!numericAmount || Number.isNaN(numericAmount)) {
      toast.error("Enter a valid amount");
      return;
    }

    if (numericAmount < 10) {
      toast.error("Minimum top-up amount is ₹10");
      return;
    }

    if (numericAmount > 50000) {
      toast.error("Maximum top-up amount is ₹50,000");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmTopup = async () => {
    try {
      const result = await dispatch(
        topupWallet({
          amount: numericAmount,
          paymentMethod,
          transactionId: generateTransactionId(),
        })
      ).unwrap();

      toast.success(result.message || "Wallet topped up successfully");

      setAmount("");
      setConfirmOpen(false);

      dispatch(fetchWalletTransactions({ page: 1, limit: 20 }));
    } catch (err) {
      toast.error(err || "Top-up failed");
    }
  };

  return (
    <DashboardLayout
      title="Wallet"
      description="Manage wallet balance, top-ups, refunds, and booking payments."
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF] dark:bg-slate-800">
              <WalletCards size={28} />
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
              Current Balance
            </p>

            {isLoadingWallet ? (
              <p className="mt-3 text-sm font-bold text-[#6B7280]">
                Loading wallet...
              </p>
            ) : (
              <h2 className="mt-2 flex items-center text-5xl font-extrabold tracking-[-1px] text-[#111827] dark:text-slate-100">
                <IndianRupee size={40} />
                {wallet?.balance || 0}
              </h2>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <WalletStat
                label="Credited"
                value={wallet?.totalCredited || 0}
                type="credit"
              />

              <WalletStat
                label="Debited"
                value={wallet?.totalDebited || 0}
                type="debit"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <Plus size={22} />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-[#111827] dark:text-slate-100">
                  Add Money
                </h2>

                <p className="text-sm text-[#6B7280] dark:text-slate-400">
                  Simulated top-up for project flow.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <Input
                label="Amount"
                type="number"
                name="amount"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="500"
                icon={IndianRupee}
                min="10"
                max="50000"
              />

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 text-sm font-bold text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 dark:bg-slate-950 dark:text-slate-100"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="button"
                onClick={handleTopupClick}
                loading={isToppingUp}
                className="bg-[#9381FF] text-white"
              >
                Add Money
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#111827] dark:text-slate-100">
                Transaction History
              </h2>

              <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
                Top-ups, appointment payments, refunds, and rewards.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                dispatch(fetchWalletTransactions({ page: 1, limit: 20 }))
              }
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] dark:border-slate-800 dark:text-slate-300"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>

          {isLoadingTransactions ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-center text-sm font-bold text-[#6B7280] dark:bg-slate-950 dark:text-slate-400">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-10 text-center dark:border-slate-700 dark:bg-slate-950">
              <h3 className="text-lg font-extrabold text-[#111827] dark:text-slate-100">
                No transactions yet
              </h3>

              <p className="mt-2 text-sm text-[#6B7280] dark:text-slate-400">
                Wallet activity will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Confirm Wallet Top-up"
        description={`Add ₹${numericAmount || 0} to your DentaCare wallet?`}
        confirmText="Confirm Top-up"
        cancelText="Cancel"
        loading={isToppingUp}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmTopup}
      />
    </DashboardLayout>
  );
}

function WalletStat({ label, value, type }) {
  const isCredit = type === "credit";

  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-4 dark:bg-slate-950">
      <p className="text-xs font-bold uppercase tracking-[0.7px] text-[#9CA3AF]">
        {label}
      </p>

      <p
        className={`mt-2 flex items-center text-lg font-extrabold ${
          isCredit ? "text-green-600" : "text-red-600"
        }`}
      >
        <IndianRupee size={16} />
        {value}
      </p>
    </div>
  );
}

function TransactionCard({ transaction }) {
  const isCredit = transaction.type === "credit";
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-[#EEF0F6] p-4 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            isCredit
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          <Icon size={20} />
        </div>

        <div>
          <h3 className="text-sm font-extrabold capitalize text-[#111827] dark:text-slate-100">
            {transaction.reason?.replace("_", " ")}
          </h3>

          <p className="mt-1 text-xs text-[#6B7280] dark:text-slate-400">
            {transaction.description || "Wallet transaction"}
          </p>

          <p className="mt-1 text-xs font-bold text-[#9CA3AF]">
            {new Date(transaction.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p
          className={`flex items-center justify-end text-base font-extrabold ${
            isCredit ? "text-green-600" : "text-red-600"
          }`}
        >
          {isCredit ? "+" : "-"}
          <IndianRupee size={15} />
          {transaction.amount}
        </p>

        <p className="mt-1 text-xs font-bold text-[#9CA3AF]">
          Bal: ₹{transaction.balanceAfter}
        </p>
      </div>
    </article>
  );
}

export default WalletPage;