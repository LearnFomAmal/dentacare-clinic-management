import { useEffect, useState } from "react";
import { Calendar, Image, Phone, User } from "lucide-react";
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
  changeUserPasswordApi,
  deleteUserAccountApi,
  getMyProfileApi,
  updateMyProfileApi,
  updateUserThemeApi,
} from "../../features/user/userService";

import {
  changePasswordSchema,
  patientProfileSchema,
  themeSchema,
} from "../../schemas/settings.schema";

import {
  clearAccountType,
  clearAuthUser,
  saveAuthUser,
} from "../../utils/authStorage";

import { ROUTES } from "../../constants/routes";

function PatientSettingsPage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: {
      errors: profileErrors,
      isSubmitting: isProfileSubmitting,
    },
  } = useForm({
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      username: "",
      personalInfo: {
        dateOfBirth: "",
        gender: "",
        phoneNumber: "",
        bloodGroup: "",
        profileImage: "",
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

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().split("T")[0];
  };

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);

      const response = await getMyProfileApi();
      const user = response.data;

      setProfile(user);

      resetProfileForm({
        username: user?.username || "",
        personalInfo: {
          dateOfBirth: formatDateForInput(
            user?.personalInfo?.dateOfBirth
          ),
          gender: user?.personalInfo?.gender || "",
          phoneNumber: user?.personalInfo?.phoneNumber || "",
          bloodGroup: user?.personalInfo?.bloodGroup || "",
          profileImage: user?.personalInfo?.profileImage || "",
        },
      });

      resetThemeForm({
        theme: user?.settings?.theme || "light",
      });
    }catch(error) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Failed to fetch profile";

  toast.error(message);

  if (
    error?.response?.status === 401 ||
    error?.response?.status === 403
  ) {
    clearAuthUser();
    clearAccountType();

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

  const onProfileSubmit = async (data) => {
    try {
      const payload = {
        username: data.username,
        personalInfo: {
          dateOfBirth: data.personalInfo.dateOfBirth || undefined,
          gender: data.personalInfo.gender || undefined,
          phoneNumber: data.personalInfo.phoneNumber || undefined,
          bloodGroup: data.personalInfo.bloodGroup || undefined,
          profileImage: data.personalInfo.profileImage || "",
        },
      };

      const response = await updateMyProfileApi(payload);

      const updatedUser = response.data;

      setProfile(updatedUser);
      saveAuthUser(updatedUser);

      toast.success(response.message || "Profile updated successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile";

      toast.error(message);
    }
  };

  const onThemeSubmit = async (data) => {
    try {
      const response = await updateUserThemeApi(data.theme);

      toast.success(response.message || "Theme updated successfully");

      setProfile((prev) => ({
        ...prev,
        settings: {
          ...prev?.settings,
          theme: data.theme,
        },
      }));
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
      const response = await changeUserPasswordApi({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      resetPasswordForm();

      clearAuthUser();
      clearAccountType();

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

      const response = await deleteUserAccountApi();

      clearAuthUser();
      clearAccountType();

      toast.success(response.message || "Account deleted successfully");

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete account";

      toast.error(message);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <DashboardLayout title="Patient Settings">
        <div className="rounded-3xl border border-[rgba(172,178,189,0.1)] bg-white p-8 shadow-[0_12px_40px_rgba(76,89,166,0.08)]">
          <p className="text-sm font-medium text-[#595F69]">
            Loading profile...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Patient Settings">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        {/* Profile */}
        <SettingsSection
          title="Profile Information"
          description="Update your personal information and contact details."
        >
          <form
            onSubmit={handleProfileSubmit(onProfileSubmit)}
            className="space-y-6"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Username"
                name="username"
                placeholder="Amal Kumar"
                register={registerProfile}
                error={profileErrors.username}
                icon={User}
              />

              <Input
                label="Phone Number"
                name="personalInfo.phoneNumber"
                placeholder="9876543210"
                register={registerProfile}
                error={profileErrors.personalInfo?.phoneNumber}
                icon={Phone}
              />

              <Input
                label="Date of Birth"
                type="date"
                name="personalInfo.dateOfBirth"
                register={registerProfile}
                error={profileErrors.personalInfo?.dateOfBirth}
                icon={Calendar}
              />

              <Select
                label="Gender"
                name="personalInfo.gender"
                register={registerProfile}
                error={profileErrors.personalInfo?.gender}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>

              <Select
                label="Blood Group"
                name="personalInfo.bloodGroup"
                register={registerProfile}
                error={profileErrors.personalInfo?.bloodGroup}
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>

              <Input
                label="Profile Image URL"
                name="personalInfo.profileImage"
                placeholder="https://example.com/profile.jpg"
                register={registerProfile}
                error={profileErrors.personalInfo?.profileImage}
                icon={Image}
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                loading={isProfileSubmitting}
                fullWidth={false}
                className="min-w-[180px]"
              >
                Save Profile
              </Button>
            </div>
          </form>
        </SettingsSection>

        <div className="space-y-6">
          {/* Account Summary */}
          <SettingsSection
            title="Account Summary"
            description="Basic account and wallet information."
          >
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Email</span>
                <span className="font-semibold text-[#2D333B]">
                  {profile?.email || "Not available"}
                </span>
              </div>

              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Role</span>
                <span className="font-semibold capitalize text-[#2D333B]">
                  {profile?.role || "patient"}
                </span>
              </div>

              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Verified</span>
                <span className="font-semibold text-[#2D333B]">
              {profile ? (profile?.accountStatus?.isVerified ? "Yes" : "No") : "Not loaded"}
                </span>
              </div>

              <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3">
                <span className="text-[#595F69]">Wallet Balance</span>
                <span className="font-semibold text-[#4C59A6]">
                  ₹{profile?.walletSummary?.balance || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[#595F69]">Referral Code</span>
                <span className="font-semibold text-[#2D333B]">
                  {profile?.referral?.referralCode || "Not available"}
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

        {/* Password */}
        <SettingsSection
          title="Change Password"
          description="Changing your password will log you out from all devices."
        >
          <form
            onSubmit={handlePasswordSubmit(onPasswordSubmit)}
            className="grid gap-5 md:grid-cols-3"
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

            <div className="md:col-span-3">
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
          description="Deleting your account is permanent for login access. Your data will be soft deleted."
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
        title="Delete Account?"
        description="Are you sure you want to delete your account? You will be logged out immediately and cannot login again with this account."
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

export default PatientSettingsPage;