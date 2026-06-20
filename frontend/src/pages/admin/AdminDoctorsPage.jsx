import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Stethoscope,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { ROUTES } from "../../constants/routes";

import {
  blockDoctorApi,
  getDoctorsApi,
  unblockDoctorApi,
} from "../../features/admin/doctorManagementService";

const DOCTOR_PAGE_LIMIT = 10;

const normalizeDoctorsResponse = (response) => {
  const payload = response?.data || response;

  const doctors = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.doctors)
      ? payload.doctors
      : [];

  const pagination = payload?.pagination || {
    total: doctors.length,
    page: 1,
    pages: 1,
    limit: DOCTOR_PAGE_LIMIT,
  };

  return {
    doctors,
    pagination: {
      total: Number(pagination.total || 0),
      page: Number(pagination.page || 1),
      pages: Math.max(Number(pagination.pages || pagination.totalPages || 1), 1),
      limit: Number(pagination.limit || DOCTOR_PAGE_LIMIT),
    },
  };
};

const getVisiblePages = ({ currentPage, totalPages }) => {
  const pages = [];

  if (totalPages <= 5) {
    for (let index = 1; index <= totalPages; index += 1) {
      pages.push(index);
    }

    return pages;
  }

  const start = Math.max(currentPage - 2, 1);
  const end = Math.min(start + 4, totalPages);
  const adjustedStart = Math.max(end - 4, 1);

  for (let index = adjustedStart; index <= end; index += 1) {
    pages.push(index);
  }

  return pages;
};

const getDoctorName = (doctor) => {
  return [doctor?.firstName, doctor?.lastName].filter(Boolean).join(" ") || "Doctor";
};

const getSpecialtyName = (doctor) => {
  return (
    doctor?.specialization?.displayName ||
    doctor?.specialization?.name ||
    "N/A"
  );
};

const getVerificationLabel = (doctor) => {
  if (
    doctor?.accountStatus?.isVerified === true &&
    doctor?.verification?.status === "approved"
  ) {
    return "Profession Verified";
  }

  const status = doctor?.verification?.status || "not_submitted";

  return String(status)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getVerificationClass = (doctor) => {
  const status = doctor?.verification?.status || "not_submitted";

  if (
    doctor?.accountStatus?.isVerified === true &&
    status === "approved"
  ) {
    return "bg-green-50 text-green-600";
  }

  if (status === "pending") {
    return "bg-blue-50 text-blue-600";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-600";
  }

  return "bg-orange-50 text-orange-600";
};

function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: DOCTOR_PAGE_LIMIT,
  });

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [statusModal, setStatusModal] = useState({
    open: false,
    doctor: null,
    action: null,
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const currentPage = Number(pagination?.page || page || 1);
  const totalPages = Math.max(Number(pagination?.pages || 1), 1);
  const totalDoctors = Number(pagination?.total || 0);
  const limit = Number(pagination?.limit || DOCTOR_PAGE_LIMIT);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const visiblePages = useMemo(() => {
    return getVisiblePages({
      currentPage,
      totalPages,
    });
  }, [currentPage, totalPages]);

  const showingText = useMemo(() => {
    if (totalDoctors === 0) {
      return "Showing 0 doctors";
    }

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalDoctors);

    return `Showing ${start} - ${end} of ${totalDoctors} doctors`;
  }, [currentPage, limit, totalDoctors]);

  const fetchDoctors = async ({
    targetPage = page,
    targetStatus = status,
    targetRating = rating,
    targetVerificationStatus = verificationStatus,
    targetSearch = appliedSearch,
  } = {}) => {
    try {
      setIsLoading(true);

      const params = {
        page: targetPage,
        limit: DOCTOR_PAGE_LIMIT,
        sortBy: "createdAt",
        order: "desc",
      };

      if (targetSearch.trim()) {
        params.search = targetSearch.trim();
      }

      if (targetStatus) {
        params.status = targetStatus;
      }

      if (targetRating) {
        params.rating = targetRating;
      }

      if (targetVerificationStatus) {
        params.verificationStatus = targetVerificationStatus;
      }

      const response = await getDoctorsApi(params);
      const result = normalizeDoctorsResponse(response);

      setDoctors(result.doctors);
      setPagination(result.pagination);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch doctors";

      toast.error(message);

      setDoctors([]);
      setPagination({
        total: 0,
        page: 1,
        pages: 1,
        limit: DOCTOR_PAGE_LIMIT,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors({
      targetPage: page,
      targetStatus: status,
      targetRating: rating,
      targetVerificationStatus: verificationStatus,
      targetSearch: appliedSearch,
    });
  }, [page, status, rating, verificationStatus, appliedSearch]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const normalizedSearch = search.trim();

    setAppliedSearch(normalizedSearch);
    setPage(1);

    if (page === 1 && appliedSearch === normalizedSearch) {
      fetchDoctors({
        targetPage: 1,
        targetStatus: status,
        targetRating: rating,
        targetVerificationStatus: verificationStatus,
        targetSearch: normalizedSearch,
      });
    }
  };

  const handleClearSearch = () => {
    setSearch("");
    setAppliedSearch("");
    setPage(1);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  const handleRatingChange = (value) => {
    setRating(value);
    setPage(1);
  };

  const handleVerificationStatusChange = (value) => {
    setVerificationStatus(value);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchDoctors({
      targetPage: page,
      targetStatus: status,
      targetRating: rating,
      targetVerificationStatus: verificationStatus,
      targetSearch: appliedSearch,
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

  const handleGoToPage = (targetPage) => {
    if (isLoading) return;
    if (targetPage === currentPage) return;

    setPage(targetPage);
  };

  const getDoctorDetailsPath = (id) => {
    return ROUTES.ADMIN_DOCTOR_DETAILS.replace(":id", id);
  };

  const openStatusModal = (doctor) => {
    setStatusModal({
      open: true,
      doctor,
      action: doctor?.accountStatus?.isBlocked ? "unblock" : "block",
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      open: false,
      doctor: null,
      action: null,
    });
  };

  const confirmStatusChange = async () => {
    if (!statusModal.doctor?._id || !statusModal.action) return;

    try {
      setIsUpdatingStatus(true);

      let response;

      if (statusModal.action === "block") {
        response = await blockDoctorApi(statusModal.doctor._id);
      } else {
        response = await unblockDoctorApi(statusModal.doctor._id);
      }

      toast.success(
        response?.message || `Doctor ${statusModal.action}ed successfully`
      );

      closeStatusModal();

      await fetchDoctors({
        targetPage: page,
        targetStatus: status,
        targetRating: rating,
        targetVerificationStatus: verificationStatus,
        targetSearch: appliedSearch,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update doctor status";

      toast.error(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <DashboardLayout title="Doctor Management">
      <div className="space-y-6">
        <SettingsSection
          title="Doctors"
          description="Create doctors, view details, and manage access."
        >
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="grid flex-1 gap-4 xl:grid-cols-[1fr_160px_160px_190px_130px_130px]"
            >
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B93A5]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search doctor by name or email..."
                  className="h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white pl-11 pr-4 text-sm text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <select
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className="h-12 rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 text-sm font-medium text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Status</option>
                <option value="unblocked">Unblocked</option>
                <option value="blocked">Blocked</option>
              </select>

              <select
                value={rating}
                onChange={(event) => handleRatingChange(event.target.value)}
                className="h-12 rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 text-sm font-medium text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Ratings</option>
                <option value="5">5 star</option>
                <option value="4">4+ rating</option>
                <option value="3">3+ rating</option>
                <option value="2">2+ rating</option>
                <option value="1">1+ rating</option>
              </select>

              <select
                value={verificationStatus}
                onChange={(event) =>
                  handleVerificationStatusChange(event.target.value)
                }
                className="h-12 rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 text-sm font-medium text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">All Verification</option>
                <option value="not_submitted">Not Submitted</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                type="submit"
                className="h-12 rounded-2xl bg-[#B8B8FF] px-5 text-sm font-bold text-[#2D333B] transition hover:bg-[#a8a8f5]"
              >
                Search
              </button>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-5 text-sm font-bold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
            </form>

            <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
              <Link
                to={ROUTES.ADMIN_ADD_DOCTOR}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#4C59A6] px-5 text-sm font-bold text-white transition hover:bg-[#404b91]"
              >
                <Plus size={17} />
                Add Doctor
              </Link>

              <Link
                to={ROUTES.ADMIN_DOCTOR_VERIFICATION_REQUESTS}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#4C59A6] px-5 text-sm font-bold text-[#4C59A6] transition hover:bg-[#F0F1FF] dark:hover:bg-slate-900"
              >
                <ShieldCheck size={17} />
                Verifications
              </Link>
            </div>
          </div>

          {(appliedSearch || status || rating || verificationStatus) && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#F8FAFC] p-4 dark:bg-slate-950">
              <p className="text-sm font-bold text-[#595F69] dark:text-slate-400">
                Active filters:
              </p>

              {appliedSearch && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#4C59A6] ring-1 ring-[rgba(172,178,189,0.2)] dark:bg-slate-900 dark:text-slate-200">
                  Search: {appliedSearch}
                </span>
              )}

              {status && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold capitalize text-[#4C59A6] ring-1 ring-[rgba(172,178,189,0.2)] dark:bg-slate-900 dark:text-slate-200">
                  Status: {status}
                </span>
              )}

              {rating && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#4C59A6] ring-1 ring-[rgba(172,178,189,0.2)] dark:bg-slate-900 dark:text-slate-200">
                  Rating: {rating}+
                </span>
              )}

              {verificationStatus && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold capitalize text-[#4C59A6] ring-1 ring-[rgba(172,178,189,0.2)] dark:bg-slate-900 dark:text-slate-200">
                  Verification: {verificationStatus.replaceAll("_", " ")}
                </span>
              )}

              {appliedSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="text-xs font-extrabold text-red-500 transition hover:text-red-600"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {isLoading ? (
            <p className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#595F69] dark:bg-slate-950 dark:text-slate-400">
              Loading doctors...
            </p>
          ) : doctors.length === 0 ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-center dark:bg-slate-950">
              <p className="text-sm font-medium text-[#595F69] dark:text-slate-400">
                No doctors found.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-[rgba(172,178,189,0.15)]">
                <table className="w-full min-w-[1100px] text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-[0.6px] text-[#595F69] dark:bg-slate-950 dark:text-slate-400">
                      <th className="px-5 py-4">Doctor</th>
                      <th className="px-5 py-4">Specialty</th>
                      <th className="px-5 py-4">Experience</th>
                      <th className="px-5 py-4">Fee</th>
                      <th className="px-5 py-4">Rating</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {doctors.map((doctor) => (
                      <DoctorRow
                        key={doctor._id}
                        doctor={doctor}
                        detailsPath={getDoctorDetailsPath(doctor._id)}
                        onStatusClick={() => openStatusModal(doctor)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                showingText={showingText}
                page={currentPage}
                totalPages={totalPages}
                visiblePages={visiblePages}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                isLoading={isLoading}
                onPrevious={handlePreviousPage}
                onNext={handleNextPage}
                onGoToPage={handleGoToPage}
              />
            </>
          )}
        </SettingsSection>
      </div>

      <ConfirmModal
        open={statusModal.open}
        title={
          statusModal.action === "block"
            ? "Block Doctor?"
            : "Unblock Doctor?"
        }
        description={`Are you sure you want to ${
          statusModal.action === "block" ? "block" : "unblock"
        } "${
          statusModal.doctor
            ? getDoctorName(statusModal.doctor)
            : "this doctor"
        }"?`}
        confirmText={statusModal.action === "block" ? "Block" : "Unblock"}
        danger={statusModal.action === "block"}
        loading={isUpdatingStatus}
        onConfirm={confirmStatusChange}
        onCancel={closeStatusModal}
      />
    </DashboardLayout>
  );
}

function DoctorRow({ doctor, detailsPath, onStatusClick }) {
  const isBlocked = Boolean(doctor.accountStatus?.isBlocked);
  const profileImage = doctor.professionalInfo?.profileImage || doctor.profileImage || "";

  return (
    <tr className="border-t border-[rgba(172,178,189,0.12)] bg-white text-sm dark:border-slate-800 dark:bg-slate-900">
      <td className="px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
            {profileImage ? (
              <img
                src={profileImage}
                alt={getDoctorName(doctor)}
                className="h-full w-full object-cover"
              />
            ) : (
              <Stethoscope size={18} />
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-[#2D333B] dark:text-slate-100">
              {getDoctorName(doctor)}
            </p>

            <p className="truncate text-xs text-[#595F69] dark:text-slate-400">
              {doctor.email || "N/A"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-[#595F69] dark:text-slate-300">
        <p className="max-w-[180px] truncate">{getSpecialtyName(doctor)}</p>
      </td>

      <td className="px-5 py-4 text-[#595F69] dark:text-slate-300">
        {doctor.professionalInfo?.experience ?? 0} yrs
      </td>

      <td className="px-5 py-4 font-semibold text-[#4C59A6]">
        ₹{doctor.professionalInfo?.consultationFee ?? 0}
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-1 font-semibold text-[#2D333B] dark:text-slate-100">
          <Star size={15} fill="currentColor" className="text-[#F59E0B]" />

          <span>{doctor.stats?.averageRating || 0}</span>

          <span className="text-xs text-[#8B93A5]">
            ({doctor.stats?.totalReviews || 0})
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="space-y-1">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
              isBlocked
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {isBlocked ? "Blocked" : "Active"}
          </span>

          <span
            className={`block w-fit rounded-full px-3 py-1 text-xs font-bold ${getVerificationClass(
              doctor
            )}`}
          >
            {getVerificationLabel(doctor)}
          </span>
        </div>
      </td>

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <Link
            to={detailsPath}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(172,178,189,0.2)] text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6] dark:border-slate-700 dark:text-slate-300"
            title="View details"
          >
            <Eye size={16} />
          </Link>

          <button
            type="button"
            onClick={onStatusClick}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
              isBlocked
                ? "bg-green-50 text-green-600 hover:bg-green-100"
                : "bg-red-50 text-red-600 hover:bg-red-100"
            }`}
            title={isBlocked ? "Unblock doctor" : "Block doctor"}
          >
            {isBlocked ? <ShieldCheck size={16} /> : <Ban size={16} />}
          </button>
        </div>
      </td>
    </tr>
  );
}

function PaginationControls({
  showingText,
  page,
  totalPages,
  visiblePages,
  canGoPrevious,
  canGoNext,
  isLoading,
  onPrevious,
  onNext,
  onGoToPage,
}) {
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[rgba(172,178,189,0.15)] bg-white p-5 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm font-bold text-[#595F69] dark:text-slate-400">
        {showingText}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!canGoPrevious || isLoading}
          onClick={onPrevious}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[rgba(172,178,189,0.2)] px-4 text-sm font-semibold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {visiblePages.map((item) => (
          <button
            key={item}
            type="button"
            disabled={isLoading}
            onClick={() => onGoToPage(item)}
            className={`h-10 min-w-10 rounded-2xl px-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              item === page
                ? "bg-[#B8B8FF] text-[#2D333B]"
                : "border border-[rgba(172,178,189,0.2)] text-[#595F69] hover:border-[#4C59A6] hover:text-[#4C59A6] dark:border-slate-700 dark:text-slate-300"
            }`}
          >
            {item}
          </button>
        ))}

        <button
          type="button"
          disabled={!canGoNext || isLoading}
          onClick={onNext}
          className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[rgba(172,178,189,0.2)] px-4 text-sm font-semibold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
        >
          Next
          <ChevronRight size={16} />
        </button>

        <span className="ml-0 rounded-2xl bg-[#F8FAFC] px-4 py-2 text-sm font-extrabold text-[#2D333B] dark:bg-slate-950 dark:text-slate-100 lg:ml-2">
          Page {page} of {totalPages}
        </span>
      </div>
    </div>
  );
}

export default AdminDoctorsPage;