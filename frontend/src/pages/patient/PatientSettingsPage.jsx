import { useEffect, useState } from "react";
import { Calendar, Phone, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import ProfileImageUploader from "../../components/common/ProfileImageUploader";
import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useAppDispatch } from "../../app/hooks";
import { clearAuth, setAuthUser } from "../../features/auth/authSlice";
import { applyTheme } from "../../utils/themeStorage";

import {
  changeUserPasswordApi,
  deleteUserAccountApi,
  getMyProfileApi,
  updateMyProfileApi,
  updateUserProfileImageApi,
  updateUserThemeApi,
} from "../../features/user/userService";

import {
  changePasswordSchema,
  patientProfileSchema,
  themeSchema,
} from "../../schemas/settings.schema";

import {
  clearAuthStorage,
  saveAuthUser,
} from "../../utils/authStorage";

import { ROUTES } from "../../constants/routes";

function PatientSettingsPage() {
  
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
    resolver: zodResolver(patientProfileSchema),
    defaultValues: {
      username: "",
      personalInfo: {
        dateOfBirth: "",
        gender: "",
        phoneNumber: "",
        bloodGroup: "",
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

 const normalizeUser = (user) => {
  const profileImage =
    user?.profileImage ||
    user?.personalInfo?.profileImage ||
    "";

  return {
    ...user,

    role: user?.role || "patient",
    accountType: "patient",

    authProvider: user?.authProvider || "local",
    profileImage,
    isProfileComplete: Boolean(user?.isProfileComplete),

    accountStatus: {
      isVerified: Boolean(user?.accountStatus?.isVerified),
      isBlocked: Boolean(user?.accountStatus?.isBlocked),
      isDeleted: Boolean(user?.accountStatus?.isDeleted),
    },

    walletSummary: {
      balance: user?.walletSummary?.balance ?? 0,
      totalEarned: user?.walletSummary?.totalEarned ?? 0,
      totalSpent: user?.walletSummary?.totalSpent ?? 0,
    },

    referral: {
      referralCode: user?.referral?.referralCode || "",
      referredBy: user?.referral?.referredBy || null,
      hasCompletedFirstAppointment: Boolean(
        user?.referral?.hasCompletedFirstAppointment
      ),
    },

    settings: {
      theme: user?.settings?.theme || user?.theme || "light",
    },

    personalInfo: {
      dateOfBirth: user?.personalInfo?.dateOfBirth || "",
      gender: user?.personalInfo?.gender || "",
      phoneNumber: user?.personalInfo?.phoneNumber || "",
      bloodGroup: user?.personalInfo?.bloodGroup || "",
      profileImage,
    },
  };
};

  const syncFormsWithUser = (user) => {
    resetProfileForm({
      username: user?.username || "",
      personalInfo: {
        dateOfBirth: formatDateForInput(user?.personalInfo?.dateOfBirth),
        gender: user?.personalInfo?.gender || "",
        phoneNumber: user?.personalInfo?.phoneNumber || "",
        bloodGroup: user?.personalInfo?.bloodGroup || "",
      },
    });

    resetThemeForm({
      theme: user?.settings?.theme || "light",
    });
  };

const handleUnauthorized = (error) => {
  if (
    error?.response?.status === 401 ||
    error?.response?.status === 403
  ) {
    clearAuthStorage("patient");
    dispatch(clearAuth("patient"));

    navigate(ROUTES.LOGIN, {
      replace: true,
    });
  }
};

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true);

      const response = await getMyProfileApi();

      const userFromApi = response?.data;

      if (!userFromApi?._id) {
        throw new Error("Invalid profile response from server");
      }

      const updatedUser = normalizeUser(userFromApi);

      setProfile(updatedUser);
      saveAuthUser(updatedUser, "patient");
      dispatch(
       setAuthUser({
         user: updatedUser,
         accountType: "patient",
         })
    );
      syncFormsWithUser(updatedUser);

      applyTheme(updatedUser?.settings?.theme || "light");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch profile";

      toast.error(message);
      handleUnauthorized(error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProfileImageUpload = async (file) => {
  try {
    setIsUploadingImage(true);

    const response = await updateUserProfileImageApi(file);

    const updatedUser = normalizeUser(response.data);

    setProfile(updatedUser);

    saveAuthUser(updatedUser, "patient");

    dispatch(
      setAuthUser({
        user: updatedUser,
        accountType: "patient",
      })
    );

    syncFormsWithUser(updatedUser);

    toast.success(response.message || "Profile image updated successfully");
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to upload profile image";

    toast.error(message);
    handleUnauthorized(error);
  } finally {
    setIsUploadingImage(false);
  }
};

  const onProfileSubmit = async (data) => {
    try {
      const payload = {
        username: data.username,
        personalInfo: {
          dateOfBirth: data.personalInfo.dateOfBirth || undefined,
          gender: data.personalInfo.gender || undefined,
          phoneNumber: data.personalInfo.phoneNumber || undefined,
          bloodGroup: data.personalInfo.bloodGroup || undefined,
        },
      };

      const response = await updateMyProfileApi(payload);

      const updatedUser = normalizeUser(response.data);

      setProfile(updatedUser);
      saveAuthUser(updatedUser, "patient");
      dispatch(
  setAuthUser({
    user: updatedUser,
    accountType: "patient",
  })
);
      syncFormsWithUser(updatedUser);

      toast.success(response.message || "Profile updated successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update profile";

      toast.error(message);
      handleUnauthorized(error);
    }
  };

  const onThemeSubmit = async (data) => {
    try {
      const response = await updateUserThemeApi(data.theme);

      const updatedUser = normalizeUser({
        ...profile,
        settings: {
          ...profile?.settings,
          theme: data.theme,
        },
        theme: data.theme,
      });

      setProfile(updatedUser);
      saveAuthUser(updatedUser, "patient");
      dispatch(
  setAuthUser({
    user: updatedUser,
    accountType: "patient",
  })
);
      applyTheme(data.theme);

      toast.success(response.message || "Theme updated successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update theme";

      toast.error(message);
      handleUnauthorized(error);
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

      clearAuthStorage("patient");
      dispatch(clearAuth("patient"));
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
      handleUnauthorized(error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      const response = await deleteUserAccountApi();

      clearAuthStorage("patient");
      dispatch(clearAuth("patient"));
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
      handleUnauthorized(error);
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <DashboardLayout title="Patient Settings">
        <div className="rounded-3xl border border-[rgba(172,178,189,0.1)] bg-white p-8 shadow-[0_12px_40px_rgba(76,89,166,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <p className="text-sm font-medium text-[#595F69] dark:text-slate-400">
            Loading profile...
          </p>
        </div>
      </DashboardLayout>
    );
  }
  const profileIncomplete = !(
  profile?.username &&
  profile?.email &&
  profile?.personalInfo?.dateOfBirth &&
  profile?.personalInfo?.gender &&
  profile?.personalInfo?.phoneNumber &&
  profile?.personalInfo?.bloodGroup
);

const isGoogleAccount = profile?.authProvider === "google";
  return (
    <DashboardLayout title="Patient Settings">
      {profileIncomplete && (
  <div className="mb-6 rounded-3xl border border-orange-100 bg-orange-50 p-5 text-sm font-semibold text-orange-700">
    Complete your profile to book appointments. Date of birth, gender,
    phone number, and blood group are required before booking.
  </div>
)}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <SettingsSection
          title="Profile Information"
          description="Update your personal information and contact details."
        >
          <div className="mb-6">
            <ProfileImageUploader
              title="Profile Picture"
              description="Upload a clear patient profile picture. JPG, PNG or WEBP up to 2MB."
              user={profile}
              imageUrl={profile?.personalInfo?.profileImage || ""}
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
          <SettingsSection
            title="Account Summary"
            description="Basic account and wallet information."
          >
            <div className="space-y-4 text-sm">
              <SummaryRow
                label="Email"
                value={profile?.email || "Not available"}
              />

              <SummaryRow
                label="Role"
                value={profile?.role || "patient"}
                capitalize
              />

              <SummaryRow
                label="Verified"
                value={profile?.accountStatus?.isVerified ? "Yes" : "No"}
              />

              <SummaryRow
                label="Wallet Balance"
                value={`₹${profile?.walletSummary?.balance ?? 0}`}
                highlight
              />

              <SummaryRow
                label="Referral Code"
                value={profile?.referral?.referralCode || "Not available"}
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
                className="min-w-[160px]"
              >
                Update Theme
              </Button>
            </form>
          </SettingsSection>
        </div>

       {isGoogleAccount ? (
  <SettingsSection
    title="Password"
    description="This account uses Google sign-in."
  >
    <div className="rounded-3xl border border-[#EEF0F6] bg-[#F8FAFC] p-6 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-sm font-semibold text-[#2D333B] dark:text-slate-100">
        Password change is not available for Google login accounts.
      </p>

      <p className="mt-2 text-sm leading-6 text-[#595F69] dark:text-slate-400">
        You signed in using Google, so your password is managed by your Google
        account. Continue using the Google login option on the login page.
      </p>
    </div>
  </SettingsSection>
) : (
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
)}

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

function SummaryRow({
  label,
  value,
  capitalize = false,
  highlight = false,
}) {
  return (
    <div className="flex justify-between border-b border-[rgba(172,178,189,0.15)] pb-3 dark:border-slate-800">
      <span className="text-[#595F69] dark:text-slate-400">
        {label}
      </span>

      <span
        className={`font-semibold ${
          highlight
            ? "text-[#4C59A6] dark:text-[#B8B8FF]"
            : "text-[#2D333B] dark:text-slate-100"
        } ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export default PatientSettingsPage;