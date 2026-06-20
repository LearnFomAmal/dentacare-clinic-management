import { useState } from "react";
import { ArrowLeft, FileText, UploadCloud } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";
import { ROUTES } from "../../constants/routes";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

function DoctorUploadDocumentsPage() {
  const navigate = useNavigate();

  const [files, setFiles] = useState({
    educationCertificate: null,
    qualificationCertificate: null,
    registrationCertificate: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event) => {
    const { name, files: selectedFiles } = event.target;

    setFiles((prev) => ({
      ...prev,
      [name]: selectedFiles?.[0] || null,
    }));
  };

  const validateFiles = () => {
    if (
      !files.educationCertificate ||
      !files.qualificationCertificate ||
      !files.registrationCertificate
    ) {
      toast.error("All three certificate files are required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateFiles()) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      formData.append(
        "educationCertificate",
        files.educationCertificate
      );

      formData.append(
        "qualificationCertificate",
        files.qualificationCertificate
      );

      formData.append(
        "registrationCertificate",
        files.registrationCertificate
      );

      const response = await axiosInstance.patch(
        API_ENDPOINTS.DOCTOR.UPLOAD_VERIFICATION_DOCUMENTS,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success(
        response?.data?.message ||
          "Verification documents uploaded successfully"
      );

      navigate(ROUTES.DOCTOR_VERIFICATION_STATUS, {
        replace: true,
      });
    } catch (error) {
      toast.error(
        getErrorMessage(error, "Failed to upload verification documents")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Upload Verification Documents">
      <div className="mb-6">
        <Link
          to={ROUTES.DOCTOR_VERIFICATION_STATUS}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#4C59A6] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to verification status
        </Link>
      </div>

      <SettingsSection
        title="Upload Certificates"
        description="Upload valid education, qualification and registration certificates. Admin will verify these before activating your doctor account."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <FileInput
            label="Education Certificate"
            name="educationCertificate"
            file={files.educationCertificate}
            onChange={handleFileChange}
          />

          <FileInput
            label="Qualification Certificate"
            name="qualificationCertificate"
            file={files.qualificationCertificate}
            onChange={handleFileChange}
          />

          <FileInput
            label="Registration Certificate"
            name="registrationCertificate"
            file={files.registrationCertificate}
            onChange={handleFileChange}
          />

          <div className="rounded-2xl bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-700">
            Accepted files: JPG, JPEG, PNG, WEBP, PDF. Maximum file size should
            match backend limit.
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#4C59A6] px-6 text-sm font-extrabold text-white transition hover:bg-[#404b91] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud size={18} />
            {isSubmitting ? "Uploading..." : "Submit for Verification"}
          </button>
        </form>
      </SettingsSection>
    </DashboardLayout>
  );
}

function FileInput({ label, name, file, onChange }) {
  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
      <label className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#374151]">
        <FileText size={18} className="text-[#4C59A6]" />
        {label}
      </label>

      <input
        type="file"
        name={name}
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        onChange={onChange}
        className="block w-full cursor-pointer rounded-2xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151] file:mr-4 file:h-11 file:border-0 file:bg-[#4C59A6] file:px-5 file:text-sm file:font-extrabold file:text-white"
      />

      {file && (
        <p className="mt-3 text-xs font-bold text-[#6B7280]">
          Selected: {file.name}
        </p>
      )}
    </div>
  );
}

export default DoctorUploadDocumentsPage;