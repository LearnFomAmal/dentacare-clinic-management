import { useEffect, useState } from "react";
import {
  Ban,
  Eye,
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

function AdminUsersPage() {
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [statusModal, setStatusModal] = useState({
    open: false,
    patient: null,
    action: null,
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);

      const params = {
        page,
        limit: 10,
        sortBy: "createdAt",
        order: "desc",
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status) {
        params.status = status;
      }

      const response = await getPatientsApi(params);

      setPatients(response?.data?.data || []);
      setPagination(response?.data?.pagination || null);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch patients";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, status]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    fetchPatients();
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
        response?.message ||
          `Patient ${statusModal.action}ed successfully`
      );

      closeStatusModal();
      await fetchPatients();
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
            className="mb-6 grid gap-4 lg:grid-cols-[1fr_220px_140px]"
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
                className="h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white pl-11 pr-4 text-sm text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-12 rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 text-sm font-medium text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10"
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
          </form>

          {isLoading ? (
            <p className="text-sm text-[#595F69]">Loading patients...</p>
          ) : patients.length === 0 ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-center">
              <p className="text-sm font-medium text-[#595F69]">
                No patients found.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[rgba(172,178,189,0.15)]">
              <div className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_160px] bg-[#F8FAFC] px-5 py-4 text-xs font-bold uppercase tracking-[0.6px] text-[#595F69]">
                <div>Patient</div>
                <div>Email</div>
                <div>Phone</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>

              {patients.map((patient) => (
                <div
                  key={patient._id}
                  className="grid grid-cols-[1.3fr_1.4fr_1fr_1fr_160px] items-center border-t border-[rgba(172,178,189,0.12)] bg-white px-5 py-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
                      <UserRound size={18} />
                    </div>

                    <div>
                      <p className="font-semibold text-[#2D333B]">
                        {patient.username}
                      </p>
                      <p className="text-xs text-[#595F69]">
                        Joined{" "}
                        {patient.createdAt
                          ? new Date(patient.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="text-[#595F69]">
                    {patient.email}
                  </div>

                  <div className="text-[#595F69]">
                    {patient.personalInfo?.phoneNumber || "N/A"}
                  </div>

                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        patient.accountStatus?.isBlocked
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {patient.accountStatus?.isBlocked
                        ? "Blocked"
                        : "Active"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link
                      to={getPatientDetailsPath(patient._id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(172,178,189,0.2)] text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6]"
                      title="View details"
                    >
                      <Eye size={16} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => openStatusModal(patient)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                        patient.accountStatus?.isBlocked
                          ? "bg-green-50 text-green-600 hover:bg-green-100"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                      title={
                        patient.accountStatus?.isBlocked
                          ? "Unblock patient"
                          : "Block patient"
                      }
                    >
                      {patient.accountStatus?.isBlocked ? (
                        <ShieldCheck size={16} />
                      ) : (
                        <Ban size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-[#595F69]">
                Page {pagination.page} of {pagination.pages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  className="rounded-2xl border border-[rgba(172,178,189,0.2)] px-4 py-2 text-sm font-semibold text-[#595F69] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((prev) => prev + 1)}
                  className="rounded-2xl border border-[rgba(172,178,189,0.2)] px-4 py-2 text-sm font-semibold text-[#595F69] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
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
        confirmText={
          statusModal.action === "block" ? "Block" : "Unblock"
        }
        danger={statusModal.action === "block"}
        loading={isUpdatingStatus}
        onConfirm={confirmStatusChange}
        onCancel={closeStatusModal}
      />
    </DashboardLayout>
  );
}

export default AdminUsersPage;