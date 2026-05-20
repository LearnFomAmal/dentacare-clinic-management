import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  GraduationCap,
  Phone,
  Stethoscope,
  User,
  Wallet,
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

import {
  clearAuthStorage,
  saveAuthUser,
} from "../../utils/authStorage";
import { useAppDispatch } from "../../app/hooks";
import { clearAuth, setAuthUser } from "../../features/auth/authSlice";
import { ROUTES } from "../../constants/routes";
import { applyTheme } from "../../utils/themeStorage";
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
   const normalizeDoctorForAuth = (doctor) => ({
  _id: doctor?._id,
  firstName: doctor?.firstName,
  lastName: doctor?.lastName,
  email: doctor?.email,
  role: "doctor",
  accountType: "doctor",
  profileImage:
    doctor?.profileImage ||
    doctor?.professionalInfo?.profileImage ||
    "",
  theme: doctor?.settings?.theme || "light",
});

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);

      const response = await getMyDoctorProfileApi();
      const doctor = response.data;

      setProfile(doctor);
       const authDoctor = normalizeDoctorForAuth(doctor);

saveAuthUser(authDoctor, "doctor");

dispatch(
  setAuthUser({
    user: authDoctor,
    accountType: "doctor",
  })
);
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

   const authDoctor = normalizeDoctorForAuth(updatedDoctor);

   saveAuthUser(authDoctor, "doctor");

   dispatch(
    setAuthUser({
     user: authDoctor,
    accountType: "doctor",
   })
  );

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

     const authDoctor = normalizeDoctorForAuth(updatedDoctor);

saveAuthUser(authDoctor, "doctor");

dispatch(
  setAuthUser({
    user: authDoctor,
    accountType: "doctor",
  })
);
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

      toast.success(response.message || "Theme updated successfully");

      setProfile((prev) => ({
        ...prev,
        settings: {
          ...prev?.settings,
          theme: data.theme,
        },
      }));
      const authDoctor = normalizeDoctorForAuth({
  ...profile,
  settings: {
    ...profile?.settings,
    theme: data.theme,
  },
});

saveAuthUser(authDoctor, "doctor");

dispatch(
  setAuthUser({
    user: authDoctor,
    accountType: "doctor",
  })
);
      applyTheme(data.theme);
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

  return (
    <DashboardLayout title="Doctor Settings">
      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        {/* Profile */}
        <SettingsSection
          title="Professional Profile"
          description="Update your visible doctor profile and contact details."
        >
           <div className="mb-6">
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
</div>
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
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
                className="min-w-[190px]"
              >
                Save Profile
              </Button>
            </div>
          </form>
        </SettingsSection>

        <div className="space-y-6">
          {/* Account Summary */}
          <SettingsSection
            title="Doctor Summary"
            description="Specialty and consultation details."
          >
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Email</span>
                <span className="font-semibold text-[#2D333B]">
                  {profile?.email || "Not available"}
                </span>
              </div>

              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Specialty</span>
                <span className="font-semibold text-[#2D333B]">
                  {profile?.specialization?.name || "Not assigned"}
                </span>
              </div>

              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Consultation Fee</span>
                <span className="font-semibold text-[#4C59A6]">
                  ₹{profile?.professionalInfo?.consultationFee ?? 0}
                </span>
              </div>

              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Verified</span>
                <span className="font-semibold text-[#2D333B]">
                  {profile?.accountStatus?.isVerified ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Blocked</span>
                <span className="font-semibold text-[#2D333B]">
                  {profile?.accountStatus?.isBlocked ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#595F69]">Rating</span>
                <span className="font-semibold text-[#2D333B]">
                  {profile?.stats?.averageRating || 0} / 5
                </span>
              </div>
            </div>
          </SettingsSection>

          {/* Theme */}
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
                className="min-w-[160px]"
              >
                Update Theme
              </Button>
            </form>
          </SettingsSection>
        </div>

        {/* Read-only Admin Controlled */}
        <SettingsSection
          title="Admin Controlled Details"
          description="These details can only be changed by clinic admin."
        >
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
                <Stethoscope size={20} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
                Specialty
              </p>

              <p className="mt-1 font-semibold text-[#2D333B]">
                {profile?.specialization?.name || "Not assigned"}
              </p>
            </div>

            <div className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
                <Wallet size={20} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
                Consultation Fee
              </p>

              <p className="mt-1 font-semibold text-[#2D333B]">
                ₹{profile?.professionalInfo?.consultationFee ?? 0}
              </p>
            </div>

            <div className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
                <BriefcaseBusiness size={20} />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
                Total Appointments
              </p>

              <p className="mt-1 font-semibold text-[#2D333B]">
                {profile?.stats?.totalAppointments || 0}
              </p>
            </div>
          </div>
        </SettingsSection>

        {/* Password */}
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
                className="min-w-[190px]"
              >
                Change Password
              </Button>
            </div>
          </form>
        </SettingsSection>

        {/* Danger Zone */}
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

export default DoctorSettingsPage;