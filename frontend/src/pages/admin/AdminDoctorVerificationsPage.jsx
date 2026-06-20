import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";
import { ROUTES } from "../../constants/routes";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import ConfirmModal from "../../components/ui/ConfirmModal";

const STATUS_OPTIONS = [
  { label: "All Requests", value: "" },
  { label: "Not Submitted", value: "not_submitted" },
  { label: "Pending", value: "pending" },
  { label: "Rejected", value: "rejected" },
  { label: "Approved", value: "approved" },
];

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

const getDoctorDetailsPath = (id) => {
  return ROUTES.ADMIN_DOCTOR_DETAILS.replace(":id", id);
};

const getStatusClass = (status) => {
  if (status === "approved") return "bg-green-50 text-green-700";
  if (status === "pending") return "bg-orange-50 text-orange-700";
  if (status === "rejected") return "bg-red-50 text-red-700";
  return "bg-blue-50 text-blue-700";
};

function AdminDoctorVerificationsPage() {
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [approveModal, setApproveModal] = useState({
    open: false,
    doctor: null,
  });

  const [rejectModal, setRejectModal] = useState({
    open: false,
    doctor: null,
  });

  const [rejectionReason, setRejectionReason] = useState("");
  const [blockDoctor, setBlockDoctor] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchVerificationRequests = async () => {
    try {
      setIsLoading(true);

      const params = {
        page,
        limit: 10,
      };

      if (status) {
        params.status = status;
      }

      const response = await axiosInstance.get(
        API_ENDPOINTS.DOCTOR.ADMIN_VERIFICATION_REQUESTS,
        {
          params,
        }
      );

      const data = response?.data?.data;

      setDoctors(data?.doctors || []);
      setPagination(data?.pagination || null);
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to fetch verification requests")
      );
      setDoctors([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVerificationRequests();
  }, [status, page]);

  const openApproveModal = (doctor) => {
    setApproveModal({
      open: true,
      doctor,
    });
  };

  const closeApproveModal = () => {
    setApproveModal({
      open: false,
      doctor: null,
    });
  };

  const openRejectModal = (doctor) => {
    setRejectModal({
      open: true,
      doctor,
    });
    setRejectionReason("");
    setBlockDoctor(false);
  };

  const closeRejectModal = () => {
    setRejectModal({
      open: false,
      doctor: null,
    });
    setRejectionReason("");
    setBlockDoctor(false);
  };

  const handleApprove = async () => {
    if (!approveModal.doctor?._id) return;

    try {
      setIsUpdating(true);

      const response = await axiosInstance.patch(
        API_ENDPOINTS.DOCTOR.ADMIN_APPROVE_VERIFICATION(
          approveModal.doctor._id
        )
      );

      toast.success(
        response?.data?.message ||
          "Doctor verification approved successfully"
      );

      closeApproveModal();
      await fetchVerificationRequests();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to approve doctor verification")
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.doctor?._id) return;

    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setIsUpdating(true);

      const response = await axiosInstance.patch(
        API_ENDPOINTS.DOCTOR.ADMIN_REJECT_VERIFICATION(
          rejectModal.doctor._id
        ),
        {
          rejectionReason: rejectionReason.trim(),
          blockDoctor,
        }
      );

      toast.success(
        response?.data?.message ||
          "Doctor verification rejected successfully"
      );

      closeRejectModal();
      await fetchVerificationRequests();
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to reject doctor verification")
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout title="Doctor Verifications">
      <SettingsSection
        title="Doctor Verification Requests"
        description="Review doctor certificates and approve or reject professional verification."
      >
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-[#6B7280]">
            <Search size={18} className="text-[#4C59A6]" />
            Filter verification requests
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-12 rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm font-bold text-[#374151] outline-none transition focus:border-[#4C59A6] focus:ring-4 focus:ring-[#4C59A6]/10"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="rounded-2xl bg-[#F8FAFC] p-6 text-sm font-bold text-[#6B7280]">
            Loading verification requests...
          </p>
        ) : doctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-10 text-center">
            <h2 className="text-lg font-extrabold text-[#111827]">
              No verification requests found
            </h2>
          </div>
        ) : (
          <div className="space-y-4">
            {doctors.map((doctor) => (
              <DoctorVerificationCard
                key={doctor._id}
                doctor={doctor}
                onApprove={() => openApproveModal(doctor)}
                onReject={() => openRejectModal(doctor)}
              />
            ))}
          </div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-bold text-[#6B7280]">
              Page {pagination.page} of {pagination.pages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-2xl border border-[#E5E7EB] px-4 py-2 text-sm font-bold text-[#6B7280] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-2xl border border-[#E5E7EB] px-4 py-2 text-sm font-bold text-[#6B7280] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SettingsSection>

      <ConfirmModal
        open={approveModal.open}
        title="Approve Doctor Verification?"
        description={`Are you sure you want to approve ${
          approveModal.doctor
            ? `${approveModal.doctor.firstName} ${approveModal.doctor.lastName}`
            : "this doctor"
        }?`}
        confirmText="Approve"
        loading={isUpdating}
        onConfirm={handleApprove}
        onCancel={closeApproveModal}
      />

      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-extrabold text-[#111827]">
              Reject Doctor Verification
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
              Add a clear rejection reason. Doctor can re-upload documents
              unless you also block the account.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              rows={5}
              placeholder="Enter rejection reason..."
              className="mt-5 w-full rounded-2xl border border-[#E5E7EB] p-4 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#4C59A6] focus:ring-4 focus:ring-[#4C59A6]/10"
            />

            <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-bold text-[#374151]">
              <input
                type="checkbox"
                checked={blockDoctor}
                onChange={(event) => setBlockDoctor(event.target.checked)}
                className="h-4 w-4"
              />
              Block this doctor account also
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRejectModal}
                disabled={isUpdating}
                className="h-11 rounded-2xl border border-[#E5E7EB] px-5 text-sm font-extrabold text-[#6B7280]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isUpdating}
                className="h-11 rounded-2xl bg-red-600 px-5 text-sm font-extrabold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isUpdating ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function DoctorVerificationCard({ doctor, onApprove, onReject }) {
  const status = doctor.verification?.status || "not_submitted";
  const hasAllDocuments =
    doctor.documents?.educationCertificate?.url &&
    doctor.documents?.qualificationCertificate?.url &&
    doctor.documents?.registrationCertificate?.url;

  return (
    <article className="rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-[#111827]">
                Dr. {doctor.firstName} {doctor.lastName}
              </h2>

              <p className="text-sm font-bold text-[#6B7280]">
                {doctor.email}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold capitalize ${getStatusClass(
                status
              )}`}
            >
              {status.replace("_", " ")}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                doctor.accountStatus?.isEmailVerified
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {doctor.accountStatus?.isEmailVerified
                ? "Email Verified"
                : "Email Not Verified"}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                hasAllDocuments
                  ? "bg-green-50 text-green-700"
                  : "bg-orange-50 text-orange-700"
              }`}
            >
              {hasAllDocuments ? "Documents Uploaded" : "Documents Missing"}
            </span>
          </div>

          {doctor.verification?.rejectionReason && (
            <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              Rejection Reason: {doctor.verification.rejectionReason}
            </p>
          )}

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <DocumentLink
              label="Education"
              url={doctor.documents?.educationCertificate?.url}
            />

            <DocumentLink
              label="Qualification"
              url={doctor.documents?.qualificationCertificate?.url}
            />

            <DocumentLink
              label="Registration"
              url={doctor.documents?.registrationCertificate?.url}
            />
          </div>
        </div>

     <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
  <Link
    to={getDoctorDetailsPath(doctor._id)}
    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#E5E7EB] px-4 text-sm font-extrabold text-[#374151] transition hover:border-[#4C59A6] hover:text-[#4C59A6]"
  >
    <Eye size={16} />
    Details
  </Link>

  {status === "pending" ? (
    <>
      <button
        type="button"
        onClick={onApprove}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 text-sm font-extrabold text-white transition hover:bg-green-700"
      >
        <CheckCircle2 size={16} />
        Approve
      </button>

      <button
        type="button"
        onClick={onReject}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-extrabold text-white transition hover:bg-red-700"
      >
        <XCircle size={16} />
        Reject
      </button>
    </>
  ) : (
    <div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-center text-xs font-extrabold capitalize text-[#6B7280]">
      {status === "approved"
        ? "Already approved"
        : status === "rejected"
          ? "Already rejected"
          : "No action available"}
    </div>
  )}
</div>
      </div>
    </article>
  );
}

function DocumentLink({ label, url }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-4">
      <p className="flex items-center gap-2 text-sm font-extrabold text-[#374151]">
        <FileText size={16} className="text-[#4C59A6]" />
        {label}
      </p>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-extrabold text-[#4C59A6] hover:underline"
        >
          View File
        </a>
      ) : (
        <p className="mt-2 text-sm font-bold text-[#9CA3AF]">
          Not uploaded
        </p>
      )}
    </div>
  );
}

export default AdminDoctorVerificationsPage;