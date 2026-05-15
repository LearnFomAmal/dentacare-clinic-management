import { useEffect, useState } from "react";
import {
  Ban,
  Eye,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
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

function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  const [statusModal, setStatusModal] = useState({
    open: false,
    doctor: null,
    action: null,
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDoctors = async () => {
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

      const response = await getDoctorsApi(params);

      setDoctors(response?.data?.data || []);
      setPagination(response?.data?.pagination || null);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch doctors";

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [page, status]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();

    setPage(1);
    fetchDoctors();
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
        response?.message ||
          `Doctor ${statusModal.action}ed successfully`
      );

      closeStatusModal();
      await fetchDoctors();
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
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="grid flex-1 gap-4 lg:grid-cols-[1fr_220px_140px]"
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
                  placeholder="Search doctor by name..."
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

            <Link
              to={ROUTES.ADMIN_ADD_DOCTOR}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#4C59A6] px-5 text-sm font-bold text-white transition hover:bg-[#404b91]"
            >
              <Plus size={17} />
              Add Doctor
            </Link>
          </div>

          {isLoading ? (
            <p className="text-sm text-[#595F69]">Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-center">
              <p className="text-sm font-medium text-[#595F69]">
                No doctors found.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[rgba(172,178,189,0.15)]">
              <div className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr_160px] bg-[#F8FAFC] px-5 py-4 text-xs font-bold uppercase tracking-[0.6px] text-[#595F69]">
                <div>Doctor</div>
                <div>Specialty</div>
                <div>Experience</div>
                <div>Fee</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>

              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="grid grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr_160px] items-center border-t border-[rgba(172,178,189,0.12)] bg-white px-5 py-4 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
                      <Stethoscope size={18} />
                    </div>

                    <div>
                      <p className="font-semibold text-[#2D333B]">
                        {doctor.firstName} {doctor.lastName}
                      </p>
                      <p className="text-xs text-[#595F69]">
                        {doctor.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-[#595F69]">
                    {doctor.specialization?.name ||
                      doctor.specialization?.displayName ||
                      "N/A"}
                  </div>

                  <div className="text-[#595F69]">
                    {doctor.professionalInfo?.experience ?? 0} yrs
                  </div>

                  <div className="font-semibold text-[#4C59A6]">
                    ₹{doctor.professionalInfo?.consultationFee ?? 0}
                  </div>

                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        doctor.accountStatus?.isBlocked
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {doctor.accountStatus?.isBlocked
                        ? "Blocked"
                        : "Active"}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Link
                      to={getDoctorDetailsPath(doctor._id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(172,178,189,0.2)] text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6]"
                      title="View details"
                    >
                      <Eye size={16} />
                    </Link>

                    <button
                      type="button"
                      onClick={() => openStatusModal(doctor)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                        doctor.accountStatus?.isBlocked
                          ? "bg-green-50 text-green-600 hover:bg-green-100"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                      title={
                        doctor.accountStatus?.isBlocked
                          ? "Unblock doctor"
                          : "Block doctor"
                      }
                    >
                      {doctor.accountStatus?.isBlocked ? (
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
            ? "Block Doctor?"
            : "Unblock Doctor?"
        }
        description={`Are you sure you want to ${
          statusModal.action === "block" ? "block" : "unblock"
        } "${
          statusModal.doctor
            ? `${statusModal.doctor.firstName} ${statusModal.doctor.lastName}`
            : "this doctor"
        }"?`}
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

export default AdminDoctorsPage;