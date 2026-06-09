import { useEffect, useMemo, useState } from "react";
import {
  Edit,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import {
  clearBannerError,
  deleteBanner,
  fetchAdminBanners,
  updateBannerStatus,
} from "../../features/banner/bannerSlice";

const formatDate = (value) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusClass = (banner) => {
  if (banner.isActive) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
};

const getTypeLabel = (type) => {
  if (type === "referral") return "Referral";
  if (type === "specialty_coupon") return "Specialty Coupon";
  return type;
};

function AdminBannersPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    adminBanners,
    pagination,
    isLoading,
    isDeleting,
    error,
  } = useAppSelector((state) => state.banners);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryParams = useMemo(() => {
    return {
      page: 1,
      limit: 20,
      search,
      type,
      location,
      status,
    };
  }, [search, type, location, status]);

  useEffect(() => {
    dispatch(fetchAdminBanners(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearBannerError());
  }, [error, dispatch]);

  const handleToggleStatus = async (banner) => {
    try {
      const result = await dispatch(
        updateBannerStatus({
          bannerId: banner._id,
          isActive: !banner.isActive,
        })
      ).unwrap();

      toast.success(result.message || "Banner status updated");
    } catch (err) {
      toast.error(err || "Failed to update banner status");
    }
  };

  const handleDeleteBanner = async () => {
    if (!deleteTarget?._id) return;

    try {
      const result = await dispatch(deleteBanner(deleteTarget._id)).unwrap();

      toast.success(result.message || "Banner deleted successfully");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err || "Failed to delete banner");
    }
  };

  return (
    <DashboardLayout title="Banners">
      <main className="mx-auto max-w-[1180px] px-6 py-8">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
              Banner Management
            </p>

            <h1 className="mt-2 text-4xl font-extrabold tracking-[-1px] text-[#111827] dark:text-slate-100">
              Manage Offer Banners
            </h1>

            <p className="mt-3 max-w-[720px] text-sm leading-6 text-[#6B7280] dark:text-slate-400">
              Create referral banners and specialty coupon banners for the home
              page and find doctors page.
            </p>
          </div>

          <Link
            to={ROUTES.ADMIN_ADD_BANNER}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#9381FF] px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(147,129,255,0.26)] transition hover:bg-[#7E6EF2]"
          >
            <Plus size={17} />
            Add Banner
          </Link>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-[1fr_190px_190px_190px]">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
            <Search size={18} className="text-[#9CA3AF]" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search banner title or coupon..."
              className="h-full flex-1 bg-transparent text-sm font-semibold text-[#111827] outline-none placeholder:text-[#9CA3AF] dark:text-slate-100"
            />
          </div>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">All Types</option>
            <option value="referral">Referral</option>
            <option value="specialty_coupon">Specialty Coupon</option>
          </select>

          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">All Locations</option>
            <option value="home">Home</option>
            <option value="doctors">Find Doctors</option>
          </select>

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
              Loading banners...
            </div>
          ) : adminBanners.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F0F1FF] text-[#9381FF]">
                <ImagePlus size={30} />
              </div>

              <h2 className="mt-5 text-xl font-extrabold text-[#111827] dark:text-slate-100">
                No banners found
              </h2>

              <p className="mt-2 text-sm text-[#6B7280] dark:text-slate-400">
                Create your first referral or specialty offer banner.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead>
                  <tr className="border-b border-[#EEF0F6] text-xs uppercase tracking-[0.8px] text-[#9CA3AF] dark:border-slate-800">
                    <th className="px-6 py-4">Banner</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Locations</th>
                    <th className="px-6 py-4">Coupon</th>
                    <th className="px-6 py-4">Validity</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {adminBanners.map((banner) => (
                    <tr
                      key={banner._id}
                      className="border-b border-[#EEF0F6] last:border-0 dark:border-slate-800"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="h-16 w-24 rounded-2xl object-cover"
                          />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-[#111827] dark:text-slate-100">
                              {banner.title}
                            </p>

                            <p className="mt-1 line-clamp-1 text-xs font-semibold text-[#6B7280] dark:text-slate-400">
                              {banner.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-[#374151] dark:text-slate-300">
                          {getTypeLabel(banner.type)}
                        </p>

                        <p className="mt-1 text-xs text-[#9CA3AF]">
                          Priority {banner.priority}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          {(banner.locations || []).map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-[#F0F1FF] px-3 py-1 text-xs font-extrabold capitalize text-[#9381FF]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {banner.type === "specialty_coupon" ? (
                          <>
                            <p className="text-sm font-extrabold text-green-600">
                              {banner.couponCode}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#6B7280]">
                              {banner.specialtyId?.displayName ||
                                banner.specialtyId?.name ||
                                "Specialty"}
                            </p>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-[#9CA3AF]">
                            N/A
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-[#374151] dark:text-slate-300">
                          {formatDate(banner.startDate)}
                        </p>

                        <p className="mt-1 text-xs font-bold text-[#6B7280]">
                          to {formatDate(banner.endDate)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${getStatusClass(
                            banner
                          )}`}
                        >
                          {banner.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(banner)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#6B7280] transition hover:bg-[#F0F1FF] hover:text-[#9381FF] dark:bg-slate-800"
                            title={
                              banner.isActive
                                ? "Deactivate banner"
                                : "Activate banner"
                            }
                          >
                            {banner.isActive ? (
                              <ToggleRight size={19} />
                            ) : (
                              <ToggleLeft size={19} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/banners/${banner._id}/edit`)
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8FAFC] text-[#6B7280] transition hover:bg-[#F0F1FF] hover:text-[#9381FF] dark:bg-slate-800"
                            title="Edit banner"
                          >
                            <Edit size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(banner)}
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100"
                            title="Delete banner"
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
            Showing {adminBanners.length} of {pagination.totalBanners} banners
          </p>
        )}

        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete Banner"
          description={`Are you sure you want to delete ${
            deleteTarget?.title || "this banner"
          }? This will deactivate it and hide it from patients.`}
          confirmText="Delete"
          cancelText="Cancel"
          loading={isDeleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteBanner}
        />
      </main>
    </DashboardLayout>
  );
}

export default AdminBannersPage;