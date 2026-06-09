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
  Star,
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
import { getAdminDoctorEarningsApi } from "../../features/earnings/earningService";
function AdminDoctorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(null);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(true);
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
 
  const fetchDoctorEarnings = async () => {
  try {
    setIsLoadingEarnings(true);

    const response = await getAdminDoctorEarningsApi({
      doctorId: id,
      params: {
        page: 1,
        limit: 10,
      },
    });

    setEarnings(response.data);
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch doctor earnings";

    toast.error(message);
  } finally {
    setIsLoadingEarnings(false);
  }
};

 useEffect(() => {
  fetchDoctorDetails();
  fetchDoctorEarnings();
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
               icon={Star}
                 label="Average Rating"
                value={`${doctor?.stats?.averageRating || 0} / 5`}
             />

            <DetailCard
             icon={ShieldCheck}
            label="Total Reviews"
            value={doctor?.stats?.totalReviews || 0}
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

          <SettingsSection
  title="Doctor Reviews"
  description="View and moderate reviews submitted for this doctor."
>
  <div className="rounded-2xl bg-[#F8FAFC] p-5">
    <p className="flex items-center gap-2 text-2xl font-extrabold text-[#111827]">
      <Star size={22} fill="currentColor" className="text-[#F59E0B]" />
      {doctor?.stats?.averageRating || 0}
    </p>

    <p className="mt-1 text-sm font-bold text-[#6B7280]">
      Based on {doctor?.stats?.totalReviews || 0} approved reviews.
    </p>

    <Link
      to={`${ROUTES.ADMIN_REVIEWS}?doctorId=${doctor?._id}`}
      className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[#9381FF] px-5 text-sm font-extrabold text-white transition hover:bg-[#7E6EF2]"
    >
      Manage Doctor Reviews
    </Link>
  </div>
</SettingsSection>
        </div>
      </div>
     <DoctorEarningsSection
  earnings={earnings}
  isLoading={isLoadingEarnings}
/>
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

function DoctorEarningsSection({ earnings, isLoading }) {
  const summary = earnings?.summary || {
    totalEarned: 0,
    todayEarned: 0,
    monthlyEarned: 0,
    totalTransactions: 0,
  };

  return (
    <div className="mt-6 rounded-3xl border border-[#EEF0F6] bg-white p-7 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
      <div className="mb-6">
        <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
          Doctor Earnings
        </p>

        <h2 className="mt-2 text-2xl font-extrabold text-[#111827]">
          Earning History
        </h2>

        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
          Earnings are created only after completed appointments.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminEarningCard
          label="Today"
          value={`₹${summary.todayEarned || 0}`}
        />

        <AdminEarningCard
          label="This Month"
          value={`₹${summary.monthlyEarned || 0}`}
        />

        <AdminEarningCard
          label="Total Earned"
          value={`₹${summary.totalEarned || 0}`}
        />

        <AdminEarningCard
          label="Transactions"
          value={summary.totalTransactions || 0}
        />
      </div>

      {isLoading ? (
        <p className="mt-6 rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280]">
          Loading earning transactions...
        </p>
      ) : earnings?.transactions?.length > 0 ? (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-[#EEF0F6] text-xs uppercase tracking-[0.7px] text-[#9CA3AF]">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Appointment</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Earning Status</th>
              </tr>
            </thead>

            <tbody>
              {earnings.transactions.map((transaction) => (
                <AdminDoctorTransactionRow
                  key={transaction._id}
                  transaction={transaction}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-8 text-center text-sm font-bold text-[#6B7280]">
          No earnings found for this doctor.
        </p>
      )}
    </div>
  );
}

function AdminEarningCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-extrabold text-[#111827]">
        {value}
      </p>
    </div>
  );
}

function AdminDoctorTransactionRow({ transaction }) {
  const patientName =
    transaction.patient?.username || transaction.patient?.email || "Patient";

  const appointmentDate =
    transaction.appointment?.appointmentDate ||
    transaction.appointmentDate ||
    "N/A";

  const appointmentStatus = String(
    transaction.appointment?.status || "completed"
  ).replace("_", " ");

  const earningStatus = String(transaction.earningStatus || "earned").replace(
    "_",
    " "
  );

  return (
    <tr className="border-b border-[#EEF0F6] last:border-0">
      <td className="px-4 py-4">
        <p className="text-sm font-extrabold text-[#111827]">
          {patientName}
        </p>

        <p className="mt-1 text-xs text-[#6B7280]">
          {transaction.patient?.email || "No email"}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-sm font-bold text-[#374151]">
          {appointmentDate}
        </p>

        <p className="mt-1 text-xs capitalize text-[#6B7280]">
          {appointmentStatus}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="break-all text-xs font-bold text-[#374151]">
          {transaction.transactionId || "N/A"}
        </p>

        <p className="mt-1 text-xs capitalize text-[#6B7280]">
          {String(transaction.paymentMethod || "N/A").replace("_", " ")}
        </p>
      </td>

      <td className="px-4 py-4">
        <p className="text-sm font-extrabold text-[#111827]">
          ₹{transaction.earnedAmount || transaction.finalAmount || 0}
        </p>

        {transaction.totalDiscount > 0 && (
          <p className="mt-1 text-xs text-green-600">
            Discount ₹{transaction.totalDiscount}
          </p>
        )}
      </td>

      <td className="px-4 py-4">
        <span className="rounded-full bg-[#F0F1FF] px-3 py-1 text-xs font-extrabold capitalize text-[#9381FF]">
          Paid
        </span>
      </td>

      <td className="px-4 py-4">
        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold capitalize text-green-700">
          {earningStatus}
        </span>
      </td>
    </tr>
  );
}

export default AdminDoctorDetailsPage;