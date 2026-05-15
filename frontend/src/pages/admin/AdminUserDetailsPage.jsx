import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Calendar,
  Droplets,
  Mail,
  Phone,
  ShieldCheck,
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
  blockPatientApi,
  getPatientDetailsApi,
  unblockPatientApi,
} from "../../features/admin/patientManagementService";

function AdminUserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [statusModal, setStatusModal] = useState({
    open: false,
    action: null,
  });

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchPatientDetails = async () => {
    try {
      setIsLoading(true);

      const response = await getPatientDetailsApi(id);

      setPatient(response.data);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch patient details";

      toast.error(message);

      navigate(ROUTES.ADMIN_USERS, {
        replace: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const openStatusModal = () => {
    setStatusModal({
      open: true,
      action: patient?.accountStatus?.isBlocked ? "unblock" : "block",
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      open: false,
      action: null,
    });
  };

  const confirmStatusChange = async () => {
    if (!patient?._id || !statusModal.action) return;

    try {
      setIsUpdatingStatus(true);

      let response;

      if (statusModal.action === "block") {
        response = await blockPatientApi(patient._id);
      } else {
        response = await unblockPatientApi(patient._id);
      }

      toast.success(response?.message || "Patient status updated");

      closeStatusModal();
      await fetchPatientDetails();
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

  if (isLoading) {
    return (
      <DashboardLayout title="Patient Details">
        <SettingsSection title="Loading">
          <p className="text-sm text-[#595F69]">
            Loading patient details...
          </p>
        </SettingsSection>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Patient Details">
      <div className="mb-6">
        <Link
          to={ROUTES.ADMIN_USERS}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#4C59A6] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to patients
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <SettingsSection
          title="Personal Details"
          description="Patient profile and contact information."
        >
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#B8B8FF]/40 text-[#4C59A6]">
                <UserRound size={30} />
              </div>

              <div>
                <h2 className="font-manrope text-2xl font-extrabold text-[#2D333B]">
                  {patient?.username || "Patient"}
                </h2>

                <p className="text-sm text-[#595F69]">
                  {patient?.email || "No email available"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openStatusModal}
              className={`rounded-3xl px-5 py-3 text-sm font-bold transition ${
                patient?.accountStatus?.isBlocked
                  ? "bg-green-50 text-green-600 hover:bg-green-100"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {patient?.accountStatus?.isBlocked
                ? "Unblock Patient"
                : "Block Patient"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <DetailCard
              icon={Mail}
              label="Email"
              value={patient?.email || "Not available"}
            />

            <DetailCard
              icon={Phone}
              label="Phone"
              value={patient?.personalInfo?.phoneNumber || "Not available"}
            />

            <DetailCard
              icon={Calendar}
              label="Date of Birth"
              value={
                patient?.personalInfo?.dateOfBirth
                  ? new Date(
                      patient.personalInfo.dateOfBirth
                    ).toLocaleDateString()
                  : "Not available"
              }
            />

            <DetailCard
              icon={UserRound}
              label="Gender"
              value={patient?.personalInfo?.gender || "Not available"}
            />

            <DetailCard
              icon={Droplets}
              label="Blood Group"
              value={patient?.personalInfo?.bloodGroup || "Not available"}
            />

            <DetailCard
              icon={ShieldCheck}
              label="Verified"
              value={
                patient?.accountStatus?.isVerified ? "Yes" : "No"
              }
            />
          </div>
        </SettingsSection>

        <div className="space-y-6">
          <SettingsSection
            title="Account Status"
            description="Current patient account access state."
          >
            <div className="space-y-4 text-sm">
              <StatusRow
                label="Blocked"
                value={patient?.accountStatus?.isBlocked ? "Yes" : "No"}
                danger={patient?.accountStatus?.isBlocked}
              />

              <StatusRow
                label="Deleted"
                value={patient?.accountStatus?.isDeleted ? "Yes" : "No"}
                danger={patient?.accountStatus?.isDeleted}
              />

              <StatusRow
                label="Verified"
                value={patient?.accountStatus?.isVerified ? "Yes" : "No"}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Wallet Summary"
            description="Basic patient wallet information."
          >
            <div className="grid gap-4">
              <DetailCard
                icon={Wallet}
                label="Balance"
                value={`₹${patient?.walletSummary?.balance || 0}`}
              />

              <DetailCard
                icon={Wallet}
                label="Total Earned"
                value={`₹${patient?.walletSummary?.totalEarned || 0}`}
              />

              <DetailCard
                icon={Wallet}
                label="Total Spent"
                value={`₹${patient?.walletSummary?.totalSpent || 0}`}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Referral"
            description="Referral code and first appointment status."
          >
            <div className="space-y-4 text-sm">
              <StatusRow
                label="Referral Code"
                value={patient?.referral?.referralCode || "Not available"}
              />

              <StatusRow
                label="Completed First Appointment"
                value={
                  patient?.referral?.hasCompletedFirstAppointment
                    ? "Yes"
                    : "No"
                }
              />
            </div>
          </SettingsSection>
        </div>
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
        } "${patient?.username || "this patient"}"?`}
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

export default AdminUserDetailsPage;