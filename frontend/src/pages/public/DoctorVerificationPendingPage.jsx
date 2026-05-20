import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import AuthLayout from "../../components/layout/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { ROUTES } from "../../constants/routes";
import {
  resendDoctorVerificationOtpApi,
  verifyDoctorAccountApi,
} from "../../features/auth/authService";

import { doctorVerificationSchema } from "../../schemas/auth.schema";

function DoctorVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromLogin = location.state?.email || "";

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(doctorVerificationSchema),
    defaultValues: {
      email: emailFromLogin,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (emailFromLogin) {
      reset({
        email: emailFromLogin,
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [emailFromLogin, reset]);

  const onSubmit = async (data) => {
    try {
      const response = await verifyDoctorAccountApi({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      toast.success(
        response?.message ||
          "Doctor account verified successfully. Please login."
      );

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Doctor verification failed";
           if (
  message.toLowerCase().includes("already verified") ||
  message.toLowerCase().includes("otp not found")
) {
  toast.error("Doctor account is already verified or OTP is no longer valid. Please login.");

  navigate(ROUTES.LOGIN, {
    replace: true,
  });

  return;
}
      if (
        message.toLowerCase().includes("already verified")
      ) {
        toast.error("Doctor account is already verified. Please login.");

        navigate(ROUTES.LOGIN, {
          replace: true,
        });

        return;
      }

      toast.error(message);
    }
  };

  const handleResendOtp = async () => {
    const email = getValues("email");

    if (!email) {
      toast.error("Enter email before resending OTP");
      return;
    }

    try {
      setIsResending(true);

      const response = await resendDoctorVerificationOtpApi({
        email,
      });

      toast.success(response?.message || "OTP resent successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to resend OTP";

      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-[448px] rounded-[24px] border border-[rgba(172,178,189,0.1)] bg-white p-10 shadow-[0_12px_40px_rgba(76,89,166,0.08)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B8B8FF]/30 text-[#4C59A6]">
            <ShieldCheck size={28} />
          </div>

          <h1 className="font-manrope text-3xl font-extrabold tracking-[-0.75px] text-[#2D333B]">
            Verify Doctor Account
          </h1>

          <p className="mt-2 text-sm text-[#595F69]">
            Enter the OTP sent to your email and create a new password.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <Input
            label="Email ID"
            name="email"
            type="email"
            placeholder="doctor@example.com"
            register={register}
            error={errors.email}
            icon={Mail}
          />

          <Input
            label="OTP Code"
            name="otp"
            placeholder="123456"
            register={register}
            error={errors.otp}
            icon={ShieldCheck}
            maxLength={6}
          />

          <PasswordField
            label="New Password"
            name="newPassword"
            placeholder="••••••••"
            register={register}
            error={errors.newPassword}
            showPassword={showNewPassword}
            onToggle={() => setShowNewPassword((prev) => !prev)}
          />

          <PasswordField
            label="Confirm New Password"
            name="confirmPassword"
            placeholder="••••••••"
            register={register}
            error={errors.confirmPassword}
            showPassword={showConfirmPassword}
            onToggle={() => setShowConfirmPassword((prev) => !prev)}
          />

          <Button
            type="submit"
            loading={isSubmitting}
          >
            Verify Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className="text-sm font-bold text-[#4C59A6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResending ? "Resending..." : "Resend OTP"}
          </button>
        </div>

        <div className="mt-5 text-center">
                       <button
  type="button"
  onClick={() => navigate(ROUTES.LOGIN)}
  className="text-sm font-semibold text-[#595F69] hover:text-[#4C59A6]"
>
  Already verified? Back to Login
</button>
        </div>
      </div>
    </AuthLayout>
  );
}

function PasswordField({
  label,
  name,
  placeholder,
  register,
  error,
  showPassword,
  onToggle,
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
        {label}
      </label>

      <div className="relative">
        <Lock
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A5ADBB]"
        />

        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...register(name)}
          className={`h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white pl-11 pr-12 text-sm text-[#2D333B] outline-none transition placeholder:text-[#8B93A5] focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : ""
          }`}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B93A5] hover:text-[#4C59A6]"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

      </div>

      {error?.message && (
        <p className="text-xs font-medium text-red-500">
          {error.message}
        </p>
      )}

    </div>
  );
}

export default DoctorVerificationPage;