import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserRound,
  Wallet,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { ROUTES } from "../../constants/routes";

import {
  blockDoctorApi,
  getDoctorDetailsApi,
  unblockDoctorApi,
} from "../../features/admin/doctorManagementService";

function AdminDoctorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [statusModal, setStatusModal] = useState({
    open: false,
    action: null,
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDoctorDetails = async () => {
    try {
      setIsLoading(true);

      const response = await getDoctorDetailsApi(id);

      setDoctor(response.data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch doctor details";

      toast.error(message);

      navigate(ROUTES.ADMIN_DOCTORS, {
        replace: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorDetails();
  }, [id]);

  const openStatusModal = () => {
    setStatusModal({
      open: true,
      action: doctor?.accountStatus?.isBlocked ? "unblock" : "block",
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      open: false,
      action: null,
    });
  };

  const confirmStatusChange = async () => {
    if (!doctor?._id || !statusModal.action) return;

    try {
      setIsUpdatingStatus(true);

      let response;

      if (statusModal.action === "block") {
        response = await blockDoctorApi(doctor._id);
      } else {
        response = await unblockDoctorApi(doctor._id);
      }

      toast.success(response?.message || "Doctor status updated");

      closeStatusModal();
      await fetchDoctorDetails();
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

  const getEditFeePath = () => {
    return ROUTES.ADMIN_EDIT_DOCTOR_FEE.replace(":id", id);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Doctor Details">
        <SettingsSection title="Loading">
          <p className="text-sm text-[#595F69]">
            Loading doctor details...
          </p>
        </SettingsSection>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Doctor Details">
      <div className="mb-6">
        <Link
          to={ROUTES.ADMIN_DOCTORS}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#4C59A6] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to doctors
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <SettingsSection
          title="Doctor Profile"
          description="Doctor professional and contact information."
        >
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#B8B8FF]/40 text-[#4C59A6]">
                <Stethoscope size={30} />
              </div>

              <div>
                <h2 className="font-manrope text-2xl font-extrabold text-[#2D333B]">
                  {doctor?.name || "Doctor"}
                </h2>

                <p className="text-sm text-[#595F69]">
                  {doctor?.email || "No email available"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to={getEditFeePath()}
                className="rounded-3xl bg-[#4C59A6] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#404b91]"
              >
                Edit Fee
              </Link>

              <button
                type="button"
                onClick={openStatusModal}
                className={`rounded-3xl px-5 py-3 text-sm font-bold transition ${
                  doctor?.accountStatus?.isBlocked
                    ? "bg-green-50 text-green-600 hover:bg-green-100"
                    : "bg-red-50 text-red-600 hover:bg-red-100"
                }`}
              >
                {doctor?.accountStatus?.isBlocked
                  ? "Unblock Doctor"
                  : "Block Doctor"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailCard
              icon={Mail}
              label="Email"
              value={doctor?.email || "Not available"}
            />

            <DetailCard
              icon={Phone}
              label="Phone"
              value={doctor?.phone || "Not available"}
            />

            <DetailCard
              icon={Stethoscope}
              label="Specialty"
              value={doctor?.specialization?.name || "Not assigned"}
            />

            <DetailCard
              icon={BriefcaseBusiness}
              label="Experience"
              value={`${doctor?.experience ?? 0} years`}
            />

            <DetailCard
              icon={GraduationCap}
              label="Education"
              value={doctor?.education || "Not available"}
            />

            <DetailCard
              icon={Wallet}
              label="Consultation Fee"
              value={`₹${doctor?.consultationFee ?? 0}`}
            />
          </div>
        </SettingsSection>

        <div className="space-y-6">
          <SettingsSection
            title="Account Status"
            description="Current doctor account access state."
          >
            <div className="space-y-4 text-sm">
              <StatusRow
                label="Verified"
                value={doctor?.accountStatus?.isVerified ? "Yes" : "No"}
              />

              <StatusRow
                label="Blocked"
                value={doctor?.accountStatus?.isBlocked ? "Yes" : "No"}
                danger={doctor?.accountStatus?.isBlocked}
              />

              <StatusRow
                label="Deleted"
                value={doctor?.accountStatus?.isDeleted ? "Yes" : "No"}
                danger={doctor?.accountStatus?.isDeleted}
              />

              <StatusRow
                label="Must Change Password"
                value={
                  doctor?.accountStatus?.mustChangePassword ? "Yes" : "No"
                }
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Profile Stats"
            description="Current doctor activity summary."
          >
            <div className="grid gap-4">
              <DetailCard
                icon={ShieldCheck}
                label="Rating"
                value={`${doctor?.stats?.averageRating || 0} / 5`}
              />

              <DetailCard
                icon={UserRound}
                label="Total Patients"
                value={doctor?.stats?.totalPatients || 0}
              />

              <DetailCard
                icon={BriefcaseBusiness}
                label="Total Appointments"
                value={doctor?.stats?.totalAppointments || 0}
              />
            </div>
          </SettingsSection>
        </div>
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
        } "${doctor?.name || "this doctor"}"?`}
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

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
        <Icon size={20} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-[#2D333B]">
        {value}
      </p>
    </div>
  );
}

function StatusRow({ label, value, danger = false }) {
  return (
    <div className="flex items-center justify-between border-b border-[rgba(172,178,189,0.15)] pb-3 last:border-b-0 last:pb-0">
      <span className="text-[#595F69]">{label}</span>

      <span
        className={`font-semibold ${
          danger ? "text-red-600" : "text-[#2D333B]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default AdminDoctorDetailsPage;