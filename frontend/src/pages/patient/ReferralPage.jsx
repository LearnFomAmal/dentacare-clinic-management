import { useEffect } from "react";
import {
  CheckCircle2,
  Copy,
  Gift,
  IndianRupee,
  Share2,
  UsersRound,
} from "lucide-react";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearReferralError,
  fetchMyReferral,
  fetchMyReferralHistory,
} from "../../features/referral/referralSlice";

const getReferralShareText = (code) => {
  return `Join DentaCare using my referral code ${code} and get a discount on your first appointment.`;
};

function ReferralPage() {
  const dispatch = useAppDispatch();

  const {
    myReferral,
    myReferralHistory,
    isLoading,
    isLoadingHistory,
    error,
  } = useAppSelector((state) => state.referrals);

  useEffect(() => {
    dispatch(fetchMyReferral());
    dispatch(fetchMyReferralHistory());
  }, [dispatch]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearReferralError());
  }, [error, dispatch]);

  const referralCode = myReferral?.referralCode || "";

  const handleCopy = async () => {
    if (!referralCode) {
      toast.error("Referral code not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied");
    } catch {
      toast.error("Failed to copy referral code");
    }
  };

  const handleShare = async () => {
    if (!referralCode) {
      toast.error("Referral code not available");
      return;
    }

    const text = getReferralShareText(referralCode);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "DentaCare Referral",
          text,
        });
      } catch {
        // user cancelled share
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Referral message copied");
    } catch {
      toast.error("Failed to share referral");
    }
  };

  const config = myReferral?.config;
  const stats = myReferral?.stats || {
    totalReferred: 0,
    pending: 0,
    discountUsed: 0,
    completed: 0,
  };

  return (
    <DashboardLayout
      title="Referrals"
      description="Share your referral code and track your rewards."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
                  Your referral code
                </p>

                <h2 className="mt-2 text-4xl font-extrabold tracking-[-1px] text-[#111827] dark:text-slate-100">
                  {isLoading ? "Loading..." : referralCode || "Not available"}
                </h2>

                <p className="mt-3 max-w-[620px] text-sm leading-6 text-[#6B7280] dark:text-slate-400">
                  Share this code with friends. They get a first appointment
                  discount, and your reward will be prepared after their first
                  completed appointment.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#F0F1FF] px-5 text-sm font-extrabold text-[#9381FF] transition hover:bg-[#E6E2FF]"
                >
                  <Copy size={17} />
                  Copy
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#9381FF] px-5 text-sm font-extrabold text-white transition hover:bg-[#7E6EF2]"
                >
                  <Share2 size={17} />
                  Share
                </button>
              </div>
            </div>
          </div>

          <section className="grid gap-4 md:grid-cols-4">
            <StatCard
              label="Total Referred"
              value={stats.totalReferred}
              icon={UsersRound}
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              icon={Gift}
            />
            <StatCard
              label="Discount Used"
              value={stats.discountUsed}
              icon={CheckCircle2}
            />
            <StatCard
              label="Completed"
              value={stats.completed}
              icon={CheckCircle2}
            />
          </section>

          <section className="rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xl font-extrabold text-[#111827] dark:text-slate-100">
              Referral History
            </h2>

            {isLoadingHistory ? (
              <p className="mt-5 rounded-2xl bg-[#F8FAFC] p-5 text-sm font-bold text-[#6B7280] dark:bg-slate-800 dark:text-slate-400">
                Loading referral history...
              </p>
            ) : myReferralHistory.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-8 text-center text-sm font-bold text-[#6B7280] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                No referrals yet. Share your code to invite friends.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {myReferralHistory.map((item) => (
                  <ReferralHistoryCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </section>
        </section>

        <aside className="h-fit rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
            <IndianRupee size={23} />
          </div>

          <h2 className="mt-4 text-xl font-extrabold text-[#111827] dark:text-slate-100">
            Referral Benefits
          </h2>

          {config?.isActive ? (
            <div className="mt-5 space-y-4">
              <BenefitRow
                label="Friend gets"
                value={
                  config.refereeDiscountType === "percentage"
                    ? `${config.refereeDiscountValue}% off`
                    : `₹${config.refereeDiscountValue} off`
                }
              />

              <BenefitRow
                label="Max friend discount"
                value={`₹${config.maxDiscount || 0}`}
              />

              <BenefitRow
                label="You earn"
                value={`₹${config.referrerReward || 0}`}
              />

              <p className="rounded-2xl bg-orange-50 p-4 text-xs font-bold leading-5 text-orange-600">
                Your reward will be credited after your friend completes their
                first appointment. Wallet credit is handled in the next module.
              </p>
            </div>
          ) : (
            <p className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">
              Referral rewards are currently inactive.
            </p>
          )}
        </aside>
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-3xl border border-[#EEF0F6] bg-white p-5 shadow-[0_14px_38px_rgba(17,24,39,0.04)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#9381FF]">
        <Icon size={19} />
      </div>

      <p className="mt-4 text-sm font-bold text-[#6B7280] dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-extrabold text-[#111827] dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function ReferralHistoryCard({ item }) {
  const referredUser = item.referredUserId;
  const name = referredUser?.username || referredUser?.email || "Patient";

  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-4 dark:border-slate-800 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-[#111827] dark:text-slate-100">
            {name}
          </h3>

          <p className="mt-1 text-xs text-[#6B7280] dark:text-slate-400">
            Joined on{" "}
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString()
              : "N/A"}
          </p>
        </div>

        <span className="rounded-full bg-[#F0F1FF] px-3 py-1 text-xs font-extrabold capitalize text-[#9381FF]">
          {String(item.status || "pending").replace("_", " ")}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MiniRow label="Friend discount" value={`₹${item.refereeDiscount || 0}`} />
        <MiniRow label="Your reward" value={`₹${item.referrerReward || 0}`} />
      </div>
    </div>
  );
}

function MiniRow({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
      <p className="text-xs font-bold text-[#6B7280] dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-[#111827] dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function BenefitRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-[#EEF0F6] pb-3 last:border-0 dark:border-slate-800">
      <span className="text-sm font-bold text-[#6B7280] dark:text-slate-400">
        {label}
      </span>

      <span className="text-sm font-extrabold text-[#111827] dark:text-slate-100">
        {value}
      </span>
    </div>
  );
}

export default ReferralPage;