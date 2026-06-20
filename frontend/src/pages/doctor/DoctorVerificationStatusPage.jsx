import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch } from "../../app/hooks";
import { verifyCurrentUser } from "../../features/auth/authSlice";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";
import { ROUTES } from "../../constants/routes";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

const getStatusConfig = (status) => {
  if (status === "approved") {
    return {
      icon: CheckCircle2,
      title: "Verification Approved",
      message:
        "Your certificates are approved. You can now manage slots and receive appointments.",
      className: "border-green-100 bg-green-50 text-green-700",
    };
  }

  if (status === "pending") {
    return {
      icon: Clock,
      title: "Verification Pending",
      message:
        "Your documents are submitted. Please wait for admin approval.",
      className: "border-orange-100 bg-orange-50 text-orange-700",
    };
  }

  if (status === "rejected") {
    return {
      icon: XCircle,
      title: "Verification Rejected",
      message:
        "Your documents were rejected. Please check the reason and upload valid documents again.",
      className: "border-red-100 bg-red-50 text-red-700",
    };
  }

  return {
    icon: AlertTriangle,
    title: "Documents Not Submitted",
    message:
      "Upload your education, qualification and registration certificates for admin approval.",
    className: "border-blue-100 bg-blue-50 text-blue-700",
  };
};

function DoctorVerificationStatusPage() {
  const [verificationData, setVerificationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
 const dispatch = useAppDispatch();
  const fetchVerification = async () => {
  try {
    setIsLoading(true);

    const response = await axiosInstance.get(
      API_ENDPOINTS.DOCTOR.MY_VERIFICATION
    );

    const data = response?.data?.data || null;

    setVerificationData(data);

    // ✅ IMPORTANT:
    // Refresh doctor auth data in redux + localStorage after admin approval/rejection.
    await dispatch(verifyCurrentUser("doctor")).unwrap();
  } catch (error) {
    toast.error(
      getErrorMessage(error, "Failed to fetch verification details")
    );
    setVerificationData(null);
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchVerification();
  }, []);

  const status = verificationData?.verification?.status || "not_submitted";
  const config = getStatusConfig(status);
  const StatusIcon = config.icon;

  return (
    <DashboardLayout title="Doctor Verification">
      <div className="space-y-6">
        <SettingsSection
          title="Verification Status"
          description="Your account becomes fully active only after admin approves your certificates."
        >
          {isLoading ? (
            <p className="text-sm font-bold text-[#6B7280]">
              Loading verification status...
            </p>
          ) : (
            <div className="space-y-6">
              <div
                className={`rounded-3xl border p-6 ${config.className}`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70">
                    <StatusIcon size={26} />
                  </div>

                  <div>
                    <h2 className="text-xl font-extrabold">
                      {config.title}
                    </h2>

                    <p className="mt-2 text-sm font-semibold leading-6">
                      {config.message}
                    </p>

                    {verificationData?.verification?.rejectionReason && (
                      <div className="mt-4 rounded-2xl bg-white/70 p-4">
                        <p className="text-xs font-extrabold uppercase">
                          Rejection Reason
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {
                            verificationData.verification
                              .rejectionReason
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <StatusInfoCard
                  label="Email Verified"
                  value={
                    verificationData?.accountStatus?.isEmailVerified
                      ? "Yes"
                      : "No"
                  }
                />

                <StatusInfoCard
                  label="Professional Verified"
                  value={
                    verificationData?.accountStatus?.isVerified
                      ? "Yes"
                      : "No"
                  }
                />
              </div>

              {status !== "approved" && (
                <Link
                  to={ROUTES.DOCTOR_UPLOAD_DOCUMENTS}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#4C59A6] px-6 text-sm font-extrabold text-white transition hover:bg-[#404b91]"
                >
                  <Upload size={17} />
                  {status === "rejected"
                    ? "Re-upload Documents"
                    : "Upload Documents"}
                </Link>
              )}
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="Uploaded Documents"
          description="Certificates submitted for admin verification."
        >
          {isLoading ? (
            <p className="text-sm font-bold text-[#6B7280]">
              Loading documents...
            </p>
          ) : (
            <div className="space-y-3">
              <DocumentRow
                label="Education Certificate"
                url={
                  verificationData?.documents?.educationCertificate?.url
                }
              />

              <DocumentRow
                label="Qualification Certificate"
                url={
                  verificationData?.documents?.qualificationCertificate
                    ?.url
                }
              />

              <DocumentRow
                label="Registration Certificate"
                url={
                  verificationData?.documents?.registrationCertificate
                    ?.url
                }
              />
            </div>
          )}
        </SettingsSection>
      </div>
    </DashboardLayout>
  );
}

function StatusInfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
        {label}
      </p>

      <p className="mt-2 text-xl font-extrabold text-[#111827]">
        {value}
      </p>
    </div>
  );
}

function DocumentRow({ label, url }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] p-4">
      <div className="flex items-center gap-3">
        <FileText size={18} className="text-[#4C59A6]" />

        <span className="text-sm font-extrabold text-[#374151]">
          {label}
        </span>
      </div>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-extrabold text-[#4C59A6] hover:underline"
        >
          View
        </a>
      ) : (
        <span className="text-sm font-bold text-[#9CA3AF]">
          Not uploaded
        </span>
      )}
    </div>
  );
}

export default DoctorVerificationStatusPage;