import { useEffect, useMemo, useState } from "react";
import {
  BadgePercent,
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearCouponError,
  deleteCoupon,
  fetchAdminCoupons,
  updateCouponStatus,
} from "../../features/coupon/couponSlice";

const getCouponStatusClass = (coupon) => {
  if (coupon.isActive) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
};

const formatDate = (value) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDiscountText = (coupon) => {
  if (coupon.discountType === "flat") {
    return `₹${coupon.discountValue} OFF`;
  }

  if (coupon.maxDiscount > 0) {
    return `${coupon.discountValue}% OFF up to ₹${coupon.maxDiscount}`;
  }

  return `${coupon.discountValue}% OFF`;
};

function AdminCouponsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    adminCoupons,
    pagination,
    isLoading,
    isDeleting,
    error,
  } = useAppSelector((state) => state.coupons);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryParams = useMemo(() => {
    return {
      page: 1,
      limit: 20,
      search,
      status,
    };
  }, [search, status]);

  useEffect(() => {
    dispatch(fetchAdminCoupons(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearCouponError());
  }, [error, dispatch]);

  const handleToggleStatus = async (coupon) => {
    try {
      const result = await dispatch(
        updateCouponStatus({
          couponId: coupon._id,
          isActive: !coupon.isActive,
        })
      ).unwrap();

      toast.success(result.message || "Coupon status updated");
    } catch (err) {
      toast.error(err || "Failed to update coupon status");
    }
  };

  const handleDeleteCoupon = async () => {
    if (!deleteTarget?._id) return;

    try {
      const result = await dispatch(deleteCoupon(deleteTarget._id)).unwrap();

      toast.success(result.message || "Coupon deleted successfully");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err || "Failed to delete coupon");
    }
  };

  return (
    <DashboardLayout title="Coupons">
      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
              Coupon Management
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-[-1px] text-[#111827] dark:text-slate-100">
              Manage Discounts
            </h1>

            <p className="mt-3 max-w-[680px] text-sm leading-6 text-[#6B7280] dark:text-slate-400">
              Create global or specialty-based coupons, control usage limits,
              and activate or deactivate discount campaigns.
            </p>
          </div>

          <Link
            to={ROUTES.ADMIN_ADD_COUPON}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#9381FF] px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2]"
          >
            <Plus size={17} />
            Add Coupon
          </Link>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-[1fr_220px]">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
            <Search size={18} className="text-[#9CA3AF]" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search coupon code, title..."
              className="h-full flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#9CA3AF] dark:text-slate-100"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </section>

        <section className="rounded-3xl border border-[#EEF0F6] bg-white shadow-[0_18px_48px_rgba(17,24,39,0.05)] dark:border-slate-800 dark:bg-slate-900">
          {isLoading ? (
            <div className="p-10 text-center text-sm font-bold text-[#6B7280]">
              Loading coupons...
            </div>
          ) : adminCoupons.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F0F1FF] text-[#9381FF]">
                <BadgePercent size={30} />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-[#111827] dark:text-slate-100">
                No coupons found
              </h2>

              <p className="mt-2 text-sm text-[#6B7280] dark:text-slate-400">
                Create your first discount coupon for patients.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-b border-[#EEF0F6] text-xs uppercase tracking-[0.8px] text-[#9CA3AF] dark:border-slate-800">
                    <th className="px-6 py-4">Coupon</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Specialty</th>
                    <th className="px-6 py-4">Usage</th>
                    <th className="px-6 py-4">Validity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {adminCoupons.map((coupon) => (
                    <tr
                      key={coupon._id}
                      className="border-b border-[#EEF0F6] last:border-0 dark:border-slate-800"
                    >
                      <td className="px-6 py-5">
                        <p className="text-sm font-extrabold text-[#111827] dark:text-slate-100">
                          {coupon.code}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-[#6B7280] dark:text-slate-400">
                          {coupon.title}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-extrabold text-green-600">
                          {getDiscountText(coupon)}
                        </p>

                        <p className="mt-1 text-xs text-[#6B7280]">
                          Min ₹{coupon.minAmount || 0}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-[#374151] dark:text-slate-300">
                          {coupon.applicableSpecialtyId
                            ? coupon.applicableSpecialtyId.displayName ||
                              coupon.applicableSpecialtyId.name
                            : "All Specialties"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-[#374151] dark:text-slate-300">
                          {coupon.usedCount || 0}
                          {coupon.maxUsage > 0 ? ` / ${coupon.maxUsage}` : " / ∞"}
                        </p>

                        <p className="mt-1 text-xs text-[#6B7280]">
                          Per user: {coupon.maxUsagePerUser}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-[#374151] dark:text-slate-300">
                          {formatDate(coupon.validFrom)}
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#6B7280]">
                          to {formatDate(coupon.validTo)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getCouponStatusClass(
                            coupon
                          )}`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(coupon)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#6B7280] transition hover:bg-[#F0F1FF] hover:text-[#9381FF] dark:bg-slate-800"
                            title={
                              coupon.isActive
                                ? "Deactivate coupon"
                                : "Activate coupon"
                            }
                          >
                            {coupon.isActive ? (
                              <ToggleRight size={19} />
                            ) : (
                              <ToggleLeft size={19} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/coupons/${coupon._id}/edit`)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#6B7280] transition hover:bg-[#F0F1FF] hover:text-[#9381FF] dark:bg-slate-800"
                            title="Edit coupon"
                          >
                            <Edit size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(coupon)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                            title="Delete coupon"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {pagination && (
          <p className="mt-4 text-sm font-bold text-[#6B7280]">
            Showing {adminCoupons.length} of {pagination.totalCoupons} coupons
          </p>
        )}

        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete Coupon"
          description={`Are you sure you want to delete ${
            deleteTarget?.code || "this coupon"
          }? This will deactivate it and hide it from patients.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteCoupon}
        />
      </main>
    </DashboardLayout>
  );
}

export default AdminCouponsPage;