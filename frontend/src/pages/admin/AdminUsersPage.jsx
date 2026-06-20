import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { ROUTES } from "../../constants/routes";

import {
  blockPatientApi,
  getPatientsApi,
  unblockPatientApi,
} from "../../features/admin/patientManagementService";

const PATIENT_PAGE_LIMIT = 10;

const normalizePatientsResponse = (response) => {
  const payload = response?.data || response;

  const patients = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.patients)
      ? payload.patients
      : [];

  const pagination = payload?.pagination || {
    total: patients.length,
    page: 1,
    pages: 1,
    limit: PATIENT_PAGE_LIMIT,
  };

  return {
    patients,
    pagination: {
      total: Number(pagination.total || 0),
      page: Number(pagination.page || 1),
      pages: Math.max(Number(pagination.pages || pagination.totalPages || 1), 1),
      limit: Number(pagination.limit || PATIENT_PAGE_LIMIT),
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

const formatJoinedDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function AdminUsersPage() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: PATIENT_PAGE_LIMIT,
  });

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [statusModal, setStatusModal] = useState({
    open: false,
    patient: null,
    action: null,
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const currentPage = Number(pagination?.page || page || 1);
  const totalPages = Math.max(Number(pagination?.pages || 1), 1);
  const totalPatients = Number(pagination?.total || 0);
  const limit = Number(pagination?.limit || PATIENT_PAGE_LIMIT);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const visiblePages = useMemo(() => {
    return getVisiblePages({
      currentPage,
      totalPages,
    });
  }, [currentPage, totalPages]);

  const showingText = useMemo(() => {
    if (totalPatients === 0) {
      return "Showing 0 patients";
    }

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, totalPatients);

    return `Showing ${start} - ${end} of ${totalPatients} patients`;
  }, [currentPage, limit, totalPatients]);

  const fetchPatients = async ({
    targetPage = page,
    targetStatus = status,
    targetSearch = appliedSearch,
  } = {}) => {
    try {
      setIsLoading(true);

      const params = {
        page: targetPage,
        limit: PATIENT_PAGE_LIMIT,
        sortBy: "createdAt",
        order: "desc",
      };

      if (targetSearch.trim()) {
        params.search = targetSearch.trim();
      }

      if (targetStatus) {
        params.status = targetStatus;
      }

      const response = await getPatientsApi(params);
      const result = normalizePatientsResponse(response);

      setPatients(result.patients);
      setPagination(result.pagination);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch patients";

      toast.error(message);
      setPatients([]);
      setPagination({
        total: 0,
        page: 1,
        pages: 1,
        limit: PATIENT_PAGE_LIMIT,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients({
      targetPage: page,
      targetStatus: status,
      targetSearch: appliedSearch,
    });
  }, [page, status, appliedSearch]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    const normalizedSearch = search.trim();

    setAppliedSearch(normalizedSearch);
    setPage(1);

    if (page === 1 && appliedSearch === normalizedSearch) {
      fetchPatients({
        targetPage: 1,
        targetStatus: status,
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

  const handleRefresh = () => {
    fetchPatients({
      targetPage: page,
      targetStatus: status,
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

  const openStatusModal = (patient) => {
    setStatusModal({
      open: true,
      patient,
      action: patient?.accountStatus?.isBlocked ? "unblock" : "block",
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      open: false,
      patient: null,
      action: null,
    });
  };

  const confirmStatusChange = async () => {
    if (!statusModal.patient?._id || !statusModal.action) return;

    try {
      setIsUpdatingStatus(true);

      let response;

      if (statusModal.action === "block") {
        response = await blockPatientApi(statusModal.patient._id);
      } else {
        response = await unblockPatientApi(statusModal.patient._id);
      }

      toast.success(
        response?.message || `Patient ${statusModal.action}ed successfully`
      );

      closeStatusModal();

      await fetchPatients({
        targetPage: page,
        targetStatus: status,
        targetSearch: appliedSearch,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update patient status";

      toast.error(message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getPatientDetailsPath = (id) => {
    return ROUTES.ADMIN_USER_DETAILS.replace(":id", id);
  };

  return (
    <DashboardLayout title="Patient Management">
      <div className="space-y-6">
        <SettingsSection
          title="Patients"
          description="View, search, block, and unblock registered patients."
        >
          <form
            onSubmit={handleSearchSubmit}
            className="mb-6 grid gap-4 xl:grid-cols-[1fr_220px_140px_140px]"
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
                placeholder="Search patient by name..."
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

          {(appliedSearch || status) && (
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
              Loading patients...
            </p>
          ) : patients.length === 0 ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-center dark:bg-slate-950">
              <p className="text-sm font-medium text-[#595F69] dark:text-slate-400">
                No patients found.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-2xl border border-[rgba(172,178,189,0.15)]">
                <table className="w-full min-w-[980px] text-left">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-xs font-bold uppercase tracking-[0.6px] text-[#595F69] dark:bg-slate-950 dark:text-slate-400">
                      <th className="px-5 py-4">Patient</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Phone</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {patients.map((patient) => (
                      <PatientRow
                        key={patient._id}
                        patient={patient}
                        detailsPath={getPatientDetailsPath(patient._id)}
                        onStatusClick={() => openStatusModal(patient)}
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
            ? "Block Patient?"
            : "Unblock Patient?"
        }
        description={`Are you sure you want to ${
          statusModal.action === "block" ? "block" : "unblock"
        } "${statusModal.patient?.username || "this patient"}"?`}
        confirmText={statusModal.action === "block" ? "Block" : "Unblock"}
        danger={statusModal.action === "block"}
        loading={isUpdatingStatus}
        onConfirm={confirmStatusChange}
        onCancel={closeStatusModal}
      />
    </DashboardLayout>
  );
}

function PatientRow({ patient, detailsPath, onStatusClick }) {
  const isBlocked = Boolean(patient.accountStatus?.isBlocked);

  return (
    <tr className="border-t border-[rgba(172,178,189,0.12)] bg-white text-sm dark:border-slate-800 dark:bg-slate-900">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
            {patient.personalInfo?.profileImage ? (
              <img
                src={patient.personalInfo.profileImage}
                alt={patient.username || "Patient"}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound size={18} />
            )}
          </div>

          <div>
            <p className="font-semibold text-[#2D333B] dark:text-slate-100">
              {patient.username || "Patient"}
            </p>

            <p className="text-xs text-[#595F69] dark:text-slate-400">
              Joined {formatJoinedDate(patient.createdAt)}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-[#595F69] dark:text-slate-300">
        {patient.email || "N/A"}
      </td>

      <td className="px-5 py-4 text-[#595F69] dark:text-slate-300">
        {patient.personalInfo?.phoneNumber || "N/A"}
      </td>

      <td className="px-5 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isBlocked
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {isBlocked ? "Blocked" : "Active"}
        </span>
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
            title={isBlocked ? "Unblock patient" : "Block patient"}
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

export default AdminUsersPage;