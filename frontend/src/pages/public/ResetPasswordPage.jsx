import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  ShieldCheck,
  LockKeyhole,
  UserRound,
  Stethoscope,
  ShieldCheck as AdminIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { resetPasswordSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";
import {
  resendForgotPasswordOtpApi,
  resetPasswordApi,
} from "../../features/auth/authService";
import {
  clearPendingForgotPasswordData,
  getPendingForgotPasswordData,
} from "../../utils/authStorage";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const pendingData = getPendingForgotPasswordData();

  const accountTypeFromState =
    location.state?.accountType || pendingData?.accountType || "patient";

  const emailFromState =
    location.state?.email || pendingData?.email || "";

  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      accountType: accountTypeFromState,
      email: emailFromState,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const selectedAccountType = watch("accountType");

  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const onSubmit = async (data) => {
    try {
      const response = await resetPasswordApi(data);

      clearPendingForgotPasswordData();

      toast.success(response?.message || "Password reset successful");

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Password reset failed";

      toast.error(message);
    }
  };

  const handleResendOtp = async () => {
    try {
      const accountType = getValues("accountType");
      const email = getValues("email");

      if (!email) {
        toast.error("Please enter your email first");
        return;
      }

      if (resendTimer > 0) {
        toast.error(`Please wait ${resendTimer}s before requesting another OTP`);
        return;
      }

      setIsResending(true);

      const response = await resendForgotPasswordOtpApi({
        accountType,
        email,
      });

      toast.success(response?.message || "OTP resent successfully");

      setResendTimer(60);
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
      <Card className="mx-auto">
        <div className="space-y-10">
          <div className="space-y-2 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
              <LockKeyhole size={28} />
            </div>

            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Create New Password
            </h1>

            <p className="text-sm leading-5 text-[#595F69]">
              Enter your OTP and set a new password
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-all ${
                selectedAccountType === "patient"
                  ? "border-[#4C59A6] bg-[#B8B8FF]/30 text-[#4C59A6]"
                  : "border-[rgba(172,178,189,0.2)] bg-white text-[#595F69]"
              }`}
            >
              <input
                type="radio"
                value="patient"
                className="hidden"
                {...register("accountType")}
              />
              <UserRound size={18} />
              Patient
            </label>

            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-all ${
                selectedAccountType === "doctor"
                  ? "border-[#4C59A6] bg-[#B8B8FF]/30 text-[#4C59A6]"
                  : "border-[rgba(172,178,189,0.2)] bg-white text-[#595F69]"
              }`}
            >
              <input
                type="radio"
                value="doctor"
                className="hidden"
                {...register("accountType")}
              />
              <Stethoscope size={18} />
              Doctor
            </label>

            <label
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-all ${
                selectedAccountType === "admin"
                  ? "border-[#4C59A6] bg-[#B8B8FF]/30 text-[#4C59A6]"
                  : "border-[rgba(172,178,189,0.2)] bg-white text-[#595F69]"
              }`}
            >
              <input
                type="radio"
                value="admin"
                className="hidden"
                {...register("accountType")}
              />
              <AdminIcon size={18} />
              Admin
            </label>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Email ID"
              type="email"
              name="email"
              placeholder="name@example.com"
              register={register}
              error={errors.email}
              icon={Mail}
            />

            <Input
              label="OTP Code"
              name="otp"
              placeholder="Enter 6 digit OTP"
              register={register}
              error={errors.otp}
              icon={ShieldCheck}
            />

            <Input
              label="New Password"
              type="password"
              name="newPassword"
              placeholder="••••••••"
              register={register}
              error={errors.newPassword}
              icon={LockKeyhole}
            />

            <Input
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              register={register}
              error={errors.confirmPassword}
              icon={LockKeyhole}
            />

            <Button type="submit" loading={isSubmitting}>
              Update Password
            </Button>
          </form>

          <div className="space-y-3 text-center text-sm">
            <p className="text-xs text-[#595F69]">
              {resendTimer > 0
                ? `You can resend OTP in ${resendTimer}s`
                : "Didn't receive the OTP?"}
            </p>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendTimer > 0 || isResending}
              className={`font-bold transition-all ${
                resendTimer > 0 || isResending
                  ? "cursor-not-allowed text-gray-400"
                  : "text-[#4C59A6] hover:underline"
              }`}
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>

            <div>
              <Link
                to={ROUTES.LOGIN}
                className="font-bold text-[#4C59A6] hover:underline"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}

export default ResetPasswordPage;