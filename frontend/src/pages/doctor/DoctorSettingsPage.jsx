import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import ProfileImageUploader from "../../components/common/ProfileImageUploader";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";

import {
  changeDoctorPasswordApi,
  deleteDoctorAccountApi,
  getMyDoctorProfileApi,
  updateDoctorProfileApi,
  updateDoctorProfileImageApi,
  updateDoctorThemeApi,
} from "../../features/doctor/doctorService";

import {
  changePasswordSchema,
  doctorProfileSchema,
  themeSchema,
} from "../../schemas/settings.schema";

import { clearAuthStorage } from "../../utils/authStorage";
import { useAppDispatch } from "../../app/hooks";
import { clearAuth, setAuthUser } from "../../features/auth/authSlice";
import { ROUTES } from "../../constants/routes";
import { applyTheme } from "../../utils/themeStorage";

const normalizeDoctorForAuth = (doctor) => ({
  ...doctor,

  _id: doctor?._id,
  firstName: doctor?.firstName || "",
  lastName: doctor?.lastName || "",
  email: doctor?.email || "",

  role: "doctor",
  accountType: "doctor",

  specialization: doctor?.specialization || null,
  professionalInfo: doctor?.professionalInfo || {},

  profileImage:
    doctor?.profileImage ||
    doctor?.professionalInfo?.profileImage ||
    "",

  theme: doctor?.settings?.theme || "light",

  settings: doctor?.settings || {
    theme: "light",
  },

  accountStatus: doctor?.accountStatus || {
    isEmailVerified: false,
    isVerified: false,
    isBlocked: false,
    isDeleted: false,
    mustChangePassword: false,
  },

  verification: doctor?.verification || {
    status: "not_submitted",
  },

  documents: doctor?.documents || {},

  stats: doctor?.stats || {
    averageRating: 0,
    totalReviews: 0,
    totalPatients: 0,
    totalAppointments: 0,
  },
});

const getVerificationStatusText = (status) => {
  if (status === "approved") return "Verification Approved";
  if (status === "rejected") return "Verification Rejected";
  if (status === "pending") return "Verification Pending";
  return "Documents Not Submitted";
};

const getVerificationDescription = (status) => {
  if (status === "approved") {
    return "Your certificates are approved. You can manage slots and receive appointments.";
  }

  if (status === "rejected") {
    return "Your certificates were rejected. Please re-upload valid documents.";
  }

  if (status === "pending") {
    return "Your certificates are submitted and waiting for admin approval.";
  }

  return "Upload your certificates to complete professional verification.";
};

function DoctorSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: {
      errors: profileErrors,
      isSubmitting: isProfileSubmitting,
    },
  } = useForm({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      professionalInfo: {
        experience: 0,
        education: "",
        contactNumber: "",
      },
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: {
      errors: passwordErrors,
      isSubmitting: isPasswordSubmitting,
    },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    register: registerTheme,
    handleSubmit: handleThemeSubmit,
    reset: resetThemeForm,
    formState: {
      errors: themeErrors,
      isSubmitting: isThemeSubmitting,
    },
  } = useForm({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      theme: "light",
    },
  });

  const syncDoctorToAuth = (doctor) => {
    const authDoctor = normalizeDoctorForAuth(doctor);

    dispatch(
      setAuthUser({
        user: authDoctor,
        accountType: "doctor",
      })
    );
  };

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);

      const response = await getMyDoctorProfileApi();
      const doctor = response.data;

      setProfile(doctor);
      syncDoctorToAuth(doctor);

      resetProfileForm({
        firstName: doctor?.firstName || "",
        lastName: doctor?.lastName || "",
        professionalInfo: {
          experience: doctor?.professionalInfo?.experience || 0,
          education: doctor?.professionalInfo?.education || "",
          contactNumber: doctor?.professionalInfo?.contactNumber || "",
        },
      });

      resetThemeForm({
        theme: doctor?.settings?.theme || "light",
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch doctor profile";

      toast.error(message);

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        clearAuthStorage("doctor");
        dispatch(clearAuth("doctor"));

        navigate(ROUTES.LOGIN, {
          replace: true,
        });
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileImageUpload = async (file) => {
    try {
      setIsUploadingImage(true);

      const response = await updateDoctorProfileImageApi(file);
      const updatedDoctor = response.data;

      setProfile(updatedDoctor);
      syncDoctorToAuth(updatedDoctor);

      resetProfileForm({
        firstName: updatedDoctor?.firstName || "",
        lastName: updatedDoctor?.lastName || "",
        professionalInfo: {
          experience: updatedDoctor?.professionalInfo?.experience || 0,
          education: updatedDoctor?.professionalInfo?.education || "",
          contactNumber:
            updatedDoctor?.professionalInfo?.contactNumber || "",
        },
      });

      toast.success(response.message || "Profile image updated successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to upload profile image";

      toast.error(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        professionalInfo: {
          experience: Number(data.professionalInfo.experience),
          education: data.professionalInfo.education,
          contactNumber: data.professionalInfo.contactNumber,
        },
      };

      const response = await updateDoctorProfileApi(payload);
      const updatedDoctor = response.data;

      setProfile(updatedDoctor);
      syncDoctorToAuth(updatedDoctor);

      toast.success(response.message || "Doctor profile updated successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update doctor profile";

      toast.error(message);
    }
  };

  const onThemeSubmit = async (data) => {
    try {
      const response = await updateDoctorThemeApi(data.theme);

      const updatedDoctor = {
        ...profile,
        settings: {
          ...profile?.settings,
          theme: data.theme,
        },
      };

      setProfile(updatedDoctor);
      syncDoctorToAuth(updatedDoctor);
      applyTheme(data.theme);

      toast.success(response.message || "Theme updated successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update theme";

      toast.error(message);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      const response = await changeDoctorPasswordApi({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      resetPasswordForm();

      clearAuthStorage("doctor");
      dispatch(clearAuth("doctor"));

      toast.success(
        response.message ||
          "Password changed successfully. Please login again."
      );

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to change password";

      toast.error(message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      const response = await deleteDoctorAccountApi();

      clearAuthStorage("doctor");
      dispatch(clearAuth("doctor"));

      toast.success(response.message || "Doctor account deleted successfully");

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete doctor account";

      toast.error(message);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <DashboardLayout title="Doctor Settings">
        <div className="rounded-3xl border border-[rgba(172,178,189,0.1)] bg-white p-8 shadow-[0_12px_40px_rgba(76,89,166,0.08)]">
          <p className="text-sm font-medium text-[#595F69]">
            Loading doctor profile...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const verificationStatus = profile?.verification?.status || "not_submitted";

  return (
    <DashboardLayout title="Doctor Settings">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <SettingsSection
            title="Professional Profile"
            description="Update your visible doctor profile and contact details."
          >
            <div className="space-y-5">
              <ProfileImageUploader
                title="Doctor Profile Picture"
                description="Upload a professional doctor profile picture. JPG, PNG or WEBP up to 2MB."
                user={profile}
                imageUrl={
                  profile?.profileImage ||
                  profile?.professionalInfo?.profileImage ||
                  ""
                }
                onUpload={handleProfileImageUpload}
                isUploading={isUploadingImage}
              />

              <form
                onSubmit={handleProfileSubmit(onProfileSubmit)}
                className="space-y-5"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="First Name"
                    name="firstName"
                    placeholder="Sarah"
                    register={registerProfile}
                    error={profileErrors.firstName}
                    icon={User}
                  />

                  <Input
                    label="Last Name"
                    name="lastName"
                    placeholder="Jenkins"
                    register={registerProfile}
                    error={profileErrors.lastName}
                    icon={User}
                  />

                  <Input
                    label="Experience"
                    type="number"
                    name="professionalInfo.experience"
                    placeholder="12"
                    register={registerProfile}
                    error={profileErrors.professionalInfo?.experience}
                    icon={BriefcaseBusiness}
                  />

                  <Input
                    label="Education"
                    name="professionalInfo.education"
                    placeholder="BDS, MDS Orthodontics"
                    register={registerProfile}
                    error={profileErrors.professionalInfo?.education}
                    icon={GraduationCap}
                  />

                  <Input
                    label="Contact Number"
                    name="professionalInfo.contactNumber"
                    placeholder="9876543210"
                    register={registerProfile}
                    error={profileErrors.professionalInfo?.contactNumber}
                    icon={Phone}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    loading={isProfileSubmitting}
                    fullWidth={false}
                    className="min-w-[170px]"
                  >
                    Save Profile
                  </Button>
                </div>
              </form>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Verification & Documents"
            description="Your professional verification status and uploaded certificates."
          >
            <div className="space-y-5">
              <div
                className={`rounded-3xl border p-5 ${
                  verificationStatus === "approved"
                    ? "border-green-100 bg-green-50"
                    : verificationStatus === "rejected"
                      ? "border-red-100 bg-red-50"
                      : verificationStatus === "pending"
                        ? "border-orange-100 bg-orange-50"
                        : "border-blue-100 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      verificationStatus === "approved"
                        ? "bg-green-100 text-green-700"
                        : verificationStatus === "rejected"
                          ? "bg-red-100 text-red-700"
                          : verificationStatus === "pending"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {verificationStatus === "approved" ? (
                      <CheckCircle2 size={24} />
                    ) : verificationStatus === "rejected" ? (
                      <XCircle size={24} />
                    ) : (
                      <ShieldCheck size={24} />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-[#111827]">
                      {getVerificationStatusText(verificationStatus)}
                    </h3>

                    <p className="mt-1 text-sm font-semibold leading-6 text-[#374151]">
                      {getVerificationDescription(verificationStatus)}
                    </p>

                    {profile?.verification?.rejectionReason && (
                      <p className="mt-3 rounded-2xl bg-white/70 p-3 text-sm font-bold text-red-700">
                        Rejection Reason:{" "}
                        {profile.verification.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <VerificationDocumentCard
                  label="Education Certificate"
                  url={profile?.documents?.educationCertificate?.url}
                />

                <VerificationDocumentCard
                  label="Qualification Certificate"
                  url={profile?.documents?.qualificationCertificate?.url}
                />

                <VerificationDocumentCard
                  label="Registration Certificate"
                  url={profile?.documents?.registrationCertificate?.url}
                />
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <SettingsSection
            title="Doctor Summary"
            description="Specialty and consultation details."
          >
            <div className="space-y-4 text-sm">
              <SummaryRow
                label="Email"
                value={profile?.email || "Not available"}
              />

              <SummaryRow
                label="Specialty"
                value={
                  profile?.specialization?.displayName ||
                  profile?.specialization?.name ||
                  "Not assigned"
                }
              />

              <SummaryRow
                label="Consultation Fee"
                value={`₹${profile?.professionalInfo?.consultationFee ?? 0}`}
                highlight
              />

              <SummaryRow
                label="Verified"
                value={profile?.accountStatus?.isVerified ? "Yes" : "No"}
              />

              <SummaryRow
                label="Blocked"
                value={profile?.accountStatus?.isBlocked ? "Yes" : "No"}
              />

              <SummaryRow
                label="Rating"
                value={`${profile?.stats?.averageRating || 0} / 5`}
                border={false}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Admin Controlled Details"
            description="These details can only be changed by clinic admin."
          >
            <div className="grid gap-4">
              <AdminControlledCard
                icon={Stethoscope}
                label="Specialty"
                value={
                  profile?.specialization?.displayName ||
                  profile?.specialization?.name ||
                  "Not assigned"
                }
              />

              <AdminControlledCard
                icon={Wallet}
                label="Consultation Fee"
                value={`₹${profile?.professionalInfo?.consultationFee ?? 0}`}
              />

              <AdminControlledCard
                icon={BriefcaseBusiness}
                label="Total Appointments"
                value={profile?.stats?.totalAppointments || 0}
              />
            </div>
          </SettingsSection>

          <SettingsSection
            title="Theme"
            description="Choose your preferred appearance."
          >
            <form
              onSubmit={handleThemeSubmit(onThemeSubmit)}
              className="space-y-5"
            >
              <Select
                label="Theme"
                name="theme"
                register={registerTheme}
                error={themeErrors.theme}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>

              <Button
                type="submit"
                loading={isThemeSubmitting}
                fullWidth={false}
                className="min-w-[150px]"
              >
                Update Theme
              </Button>
            </form>
          </SettingsSection>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <SettingsSection
          title="Change Password"
          description="Changing your password will log you out from all devices."
        >
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="grid gap-5 lg:grid-cols-3"
          >
            <Input
              label="Current Password"
              type="password"
              name="currentPassword"
              placeholder="••••••••"
              register={registerPassword}
              error={passwordErrors.currentPassword}
            />

            <Input
              label="New Password"
              type="password"
              name="newPassword"
              placeholder="••••••••"
              register={registerPassword}
              error={passwordErrors.newPassword}
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              register={registerPassword}
              error={passwordErrors.confirmPassword}
            />

            <div className="lg:col-span-3">
              <Button
                type="submit"
                loading={isPasswordSubmitting}
                fullWidth={false}
                className="min-w-[180px]"
              >
                Change Password
              </Button>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection
          title="Danger Zone"
          description="Deleting your doctor account is permanent for login access. Your data will be soft deleted."
        >
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="rounded-3xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            Delete My Account
          </button>
        </SettingsSection>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Doctor Account?"
        description="Are you sure you want to delete your doctor account? You will be logged out immediately and cannot login again with this account."
        confirmText="Delete Account"
        cancelText="Cancel"
        danger
        loading={isDeleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </DashboardLayout>
  );
}

function SummaryRow({ label, value, highlight = false, border = true }) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        border ? "border-b border-[rgba(172,178,189,0.15)] pb-3" : ""
      }`}
    >
      <span className="text-[#595F69]">{label}</span>

      <span
        className={`text-right font-semibold ${
          highlight ? "text-[#4C59A6]" : "text-[#2D333B]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function VerificationDocumentCard({ label, url }) {
  return (
    <div className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
        <FileText size={20} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
        {label}
      </p>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-sm font-extrabold text-[#4C59A6] hover:underline"
        >
          View Document
        </a>
      ) : (
        <p className="mt-2 text-sm font-bold text-[#9CA3AF]">
          Not uploaded
        </p>
      )}
    </div>
  );
}

function AdminControlledCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
        <Icon size={20} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
        {label}
      </p>

      <p className="mt-1 font-semibold text-[#2D333B]">
        {value}
      </p>
    </div>
  );
}

export default DoctorSettingsPage;