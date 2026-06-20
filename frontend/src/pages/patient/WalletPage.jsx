import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  History,
  IndianRupee,
  RefreshCcw,
  WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearWalletError,
  createWalletRazorpayOrder,
  fetchMyWallet,
  fetchWalletTransactions,
  verifyWalletRazorpayTopup,
  cancelWalletRazorpayTopup,
} from "../../features/wallet/walletSlice";

const TOPUP_METHODS = [
  {
    id: "razorpay",
    label: "Razorpay Test Mode",
  },
];

const QUICK_AMOUNTS = [100, 250, 500, 1000];
const TRANSACTION_REASON_FILTERS = [
  {
    label: "All Types",
    value: "",
  },
  {
    label: "Top Up",
    value: "topup",
  },
  {
    label: "Appointment Payment",
    value: "booking_payment",
  },
  {
    label: "Refunds",
    value: "refund",
  },
  {
    label: "Referral Rewards",
    value: "referral_reward",
  },
];

const TRANSACTION_STATUS_FILTERS = [
  {
    label: "Successful Only",
    value: "success",
  },
  {
    label: "All Status",
    value: "all",
  },
  {
    label: "Pending",
    value: "pending",
  },
  {
    label: "Cancelled",
    value: "cancelled",
  },
  {
    label: "Failed",
    value: "failed",
  },
];

const TRANSACTION_PAGE_LIMIT = 5;
const formatAmount = (amount) => {
  return Number(amount || 0).toLocaleString("en-IN");
};

const formatTransactionReason = (reason = "") => {
  return String(reason || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatTransactionDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

function WalletPage() {
  const dispatch = useAppDispatch();

  const {
    wallet,
    transactions,
    pagination,
    isLoadingWallet,
    isLoadingTransactions,
    isToppingUp,
    isCreatingWalletOrder,
    error,
  } = useAppSelector((state) => state.wallet);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [page, setPage] = useState(1);
 const [transactionReason, setTransactionReason] = useState("");
const [transactionStatus, setTransactionStatus] = useState("success");
  useEffect(() => {
    dispatch(fetchMyWallet());
  }, [dispatch]);

useEffect(() => {
  dispatch(
    fetchWalletTransactions({
      page,
      limit: TRANSACTION_PAGE_LIMIT,
      reason: transactionReason,
      status: transactionStatus,
    })
  );
}, [dispatch, page, transactionReason, transactionStatus]);
useEffect(() => {
  setPage(1);
}, [transactionReason, transactionStatus]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearWalletError());
  }, [error, dispatch]);

  const walletStats = useMemo(() => {
    return {
      balance: wallet?.balance || 0,
      totalCredited: wallet?.totalCredited || 0,
      totalDebited: wallet?.totalDebited || 0,
    };
  }, [wallet]);

 const handleRefresh = () => {
  dispatch(fetchMyWallet());
  dispatch(
    fetchWalletTransactions({
      page,
      limit: TRANSACTION_PAGE_LIMIT,
      reason: transactionReason,
      status: transactionStatus,
    })
  );
};

 const handleTopup = async (event) => {
  event.preventDefault();

  const numericAmount = Number(amount);

  if (!amount || Number.isNaN(numericAmount)) {
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

  const loaded = await loadRazorpayScript();

  if (!loaded) {
    toast.error("Failed to load Razorpay checkout");
    return;
  }

  try {
    const orderResult = await dispatch(
      createWalletRazorpayOrder({
        amount: numericAmount,
      })
    ).unwrap();

    const order = orderResult.order;
   let isTopupHandled = false;

const cancelPendingTopup = async () => {
  if (!order?.orderId || isTopupHandled) return;

  isTopupHandled = true;

  try {
    await dispatch(
      cancelWalletRazorpayTopup({
        razorpay_order_id: order.orderId,
      })
    ).unwrap();

    dispatch(
      fetchWalletTransactions({
        page: 1,
        limit: TRANSACTION_PAGE_LIMIT,
        reason: transactionReason,
        status: transactionStatus,
      })
    );
  } catch {
    // Do not block the user for cleanup failure.
  }
};
    const options = {
      key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: order.name || "DentaCare",
      description: order.description || "DentaCare wallet top-up",
      order_id: order.orderId,

      handler: async (response) => {
        isTopupHandled = true;
        try {
          const verifyResult = await dispatch(
verifyWalletRazorpayTopup({
  amount: numericAmount,
  razorpay_order_id: response.razorpay_order_id,
  razorpay_payment_id: response.razorpay_payment_id,
  razorpay_signature: response.razorpay_signature,
})
          ).unwrap();

          toast.success(
            verifyResult.message || "Wallet topped up successfully"
          );

          setAmount("");
          setPage(1);

          dispatch(fetchMyWallet());
          dispatch(fetchWalletTransactions({ page: 1, limit: 10 }));
        } catch (err) {
          toast.error(err || "Wallet top-up verification failed");
        }
      },

      prefill: {
        name: wallet?.userId?.username || "",
      },

      theme: {
        color: "#9381FF",
      },

      modal: {
  ondismiss: async () => {
    await cancelPendingTopup();
    toast.error("Wallet top-up cancelled");
  },
},
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", async (response) => {
  await cancelPendingTopup();

  toast.error(
    response?.error?.description || "Razorpay payment failed"
  );
});

    razorpay.open();
  } catch (err) {
    toast.error(err || "Failed to start wallet top-up");
  }
};

  return (
    <DashboardLayout
      title="Wallet"
      description="Manage your DentaCare wallet balance and transactions."
    >
      <div className="mx-auto max-w-[1080px] space-y-6">
        <section className="space-y-6">
          <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
                  <WalletCards size={28} />
                </div>

                <p className="mt-5 text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
                  Current Balance
                </p>

                <h1 className="mt-2 flex items-center text-5xl font-extrabold tracking-[-1.4px] text-[#111827] dark:text-slate-100">
                  <IndianRupee size={38} />
                  {isLoadingWallet ? "..." : formatAmount(walletStats.balance)}
                </h1>

                <p className="mt-3 max-w-[620px] text-sm leading-6 text-[#6B7280] dark:text-slate-400">
                  Your wallet receives refunds and referral rewards. You can
                  also top up your wallet for future appointment payments.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoadingWallet || isLoadingTransactions}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#F8F7FF] px-5 text-sm font-extrabold text-[#9381FF] transition hover:bg-[#F0F1FF] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCcw size={17} />
                Refresh
              </button>
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            <WalletStatCard
              label="Balance"
              value={walletStats.balance}
              icon={WalletCards}
            />

            <WalletStatCard
              label="Total Credited"
              value={walletStats.totalCredited}
              icon={ArrowDownCircle}
              positive
            />

            <WalletStatCard
              label="Total Debited"
              value={walletStats.totalDebited}
              icon={ArrowUpCircle}
              negative
            />
          </section>
         <aside className="h-fit rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
            <CreditCard size={24} />
          </div>

          <h2 className="mt-4 text-2xl font-extrabold text-[#111827] dark:text-slate-100">
            Top Up Wallet
          </h2>
<p className="mt-2 text-sm leading-6 text-[#6B7280] dark:text-slate-400">
  Add money to your DentaCare wallet using Razorpay test mode.
</p>

          <form onSubmit={handleTopup} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="walletAmount"
                className="text-xs font-bold uppercase tracking-[0.7px] text-[#6B7280] dark:text-slate-400"
              >
                Amount
              </label>

              <div className="relative mt-2">
                <IndianRupee
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                />

                <input
                  id="walletAmount"
                  type="number"
                  min="10"
                  max="50000"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Enter amount"
                  className="h-12 w-full rounded-2xl border border-[#EEF0F6] bg-white pl-11 pr-4 text-sm font-bold text-[#111827] outline-none transition focus:border-[#9381FF] focus:ring-2 focus:ring-[#9381FF]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {QUICK_AMOUNTS.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(String(quickAmount))}
                  className={`h-11 rounded-2xl border text-sm font-extrabold transition ${
                    Number(amount) === quickAmount
                      ? "border-[#9381FF] bg-[#F8F7FF] text-[#9381FF]"
                      : "border-[#EEF0F6] text-[#6B7280] hover:border-[#9381FF] hover:text-[#9381FF] dark:border-slate-800 dark:text-slate-400"
                  }`}
                >
                  ₹{quickAmount}
                </button>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.7px] text-[#6B7280] dark:text-slate-400">
                Payment Method
              </p>

              <div className="mt-3 grid gap-3">
                {TOPUP_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-extrabold transition ${
                      paymentMethod === method.id
                        ? "border-[#9381FF] bg-[#F8F7FF] text-[#9381FF]"
                        : "border-[#EEF0F6] text-[#6B7280] hover:border-[#9381FF] hover:text-[#9381FF] dark:border-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <span>{method.label}</span>

                    <span
                      className={`h-3 w-3 rounded-full ${
                        paymentMethod === method.id
                          ? "bg-[#9381FF]"
                          : "bg-[#D1D5DB]"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

           <button
            type="submit"
            disabled={isToppingUp || isCreatingWalletOrder}
            className="h-12 w-full rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isToppingUp || isCreatingWalletOrder
  ? "Processing..."
  : "Top Up Wallet"}
            </button>
          </form>
        </aside>
          <section className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="mb-5 grid gap-3 md:grid-cols-2">
  <select
    value={transactionReason}
    onChange={(event) => setTransactionReason(event.target.value)}
    className="h-11 rounded-2xl border border-[#EEF0F6] bg-white px-4 text-sm font-bold text-[#374151] outline-none transition focus:border-[#9381FF] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
  >
    {TRANSACTION_REASON_FILTERS.map((item) => (
      <option key={item.value || "all"} value={item.value}>
        {item.label}
      </option>
    ))}
  </select>

  <select
    value={transactionStatus}
    onChange={(event) => setTransactionStatus(event.target.value)}
    className="h-11 rounded-2xl border border-[#EEF0F6] bg-white px-4 text-sm font-bold text-[#374151] outline-none transition focus:border-[#9381FF] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
  >
    {TRANSACTION_STATUS_FILTERS.map((item) => (
      <option key={item.value} value={item.value}>
        {item.label}
      </option>
    ))}
  </select>
</div>
             
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.8px] text-[#9381FF]">
                  History
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-[#111827] dark:text-slate-100">
                  Wallet Transactions
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
                <History size={21} />
              </div>
            </div>

            {isLoadingTransactions ? (
              <div className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280] dark:bg-slate-800 dark:text-slate-400">
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-8 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
                  No wallet transactions yet.
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

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={page <= 1 || isLoadingTransactions}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="h-10 rounded-xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800"
                >
                  Previous
                </button>

                <p className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </p>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages || isLoadingTransactions
                  }
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(prev + 1, pagination.totalPages)
                    )
                  }
                  className="h-10 rounded-xl border border-[#EEF0F6] px-4 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </section>

       
      </div>
    </DashboardLayout>
  );
}

function WalletStatCard({ label, value, icon: Icon, positive, negative }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-5 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
          positive
            ? "bg-green-50 text-green-600"
            : negative
            ? "bg-orange-50 text-orange-600"
            : "bg-[#F0F1FF] text-[#9381FF]"
        }`}
      >
        <Icon size={20} />
      </div>

      <p className="mt-4 text-sm font-bold text-[#6B7280] dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 flex items-center text-3xl font-extrabold text-[#111827] dark:text-slate-100">
        <IndianRupee size={23} />
        {formatAmount(value)}
      </p>
    </div>
  );
}
const getTransactionStatusClass = (status) => {
  if (status === "success") {
    return "bg-green-50 text-green-700";
  }

  if (status === "pending") {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "cancelled") {
    return "bg-slate-100 text-slate-700";
  }

  return "bg-red-50 text-red-700";
};
function TransactionCard({ transaction }) {
  const isCredit = transaction.type === "credit";

  return (
    <article className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
              isCredit
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {isCredit ? (
              <ArrowDownCircle size={20} />
            ) : (
              <ArrowUpCircle size={20} />
            )}
          </div>

          <div>
            <h3 className="text-sm font-extrabold text-[#111827] dark:text-slate-100">
              {formatTransactionReason(transaction.reason)}
            </h3>

            <p className="mt-1 text-xs leading-5 text-[#6B7280] dark:text-slate-400">
              {transaction.description || "Wallet transaction"}
            </p>

            <p className="mt-2 text-xs font-bold text-[#9CA3AF]">
              {formatTransactionDate(transaction.createdAt)}
            </p>
            {transaction.status !== "success" && (
  <span
    className={`mt-2 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold capitalize ${getTransactionStatusClass(
      transaction.status
    )}`}
  >
    {transaction.status}
  </span>
)}
          </div>
        </div>

        <div className="text-right">
          <p
            className={`flex items-center justify-end text-base font-extrabold ${
              isCredit ? "text-green-600" : "text-red-600"
            }`}
          >
            {isCredit ? "+" : "-"} ₹{formatAmount(transaction.amount)}
          </p>

          <p className="mt-1 text-xs font-bold text-[#6B7280] dark:text-slate-400">
            Bal: ₹{formatAmount(transaction.balanceAfter)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default WalletPage;