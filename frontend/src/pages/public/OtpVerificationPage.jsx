import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { otpSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";

import {
  resendRegisterOtpApi,
  verifyRegisterOtpApi,
} from "../../features/auth/authService";

import {
  clearPendingRegisterEmail,
  getPendingRegisterEmail,
} from "../../utils/authStorage";

function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromRegister =
    location.state?.email ||
    getPendingRegisterEmail() ||
    "";

  const [resendTimer, setResendTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: emailFromRegister,
      otp: "",
    },
  });

  useEffect(() => {
    if (resendTimer <= 0) return;

    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendTimer]);

  const onSubmit = async (data) => {
    try {
      const response = await verifyRegisterOtpApi({
        email: data.email,
        otp: data.otp,
      });

      clearPendingRegisterEmail();

      toast.success(
        response?.message ||
          "Account verified successfully. Please login."
      );

      navigate(ROUTES.LOGIN, {
        replace: true,
      });
    } catch (error) {
      console.error("OTP verification error:", error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "OTP verification failed";

      toast.error(message);
    }
  };

  const handleResendOtp = async () => {
    try {
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

      const response = await resendRegisterOtpApi({
        email,
      });

      toast.success(
        response?.message ||
          "OTP resent successfully"
      );

      setResendTimer(60);
    } catch (error) {
      console.error("Resend OTP error:", error);

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
              <ShieldCheck size={28} />
            </div>

            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Verify Your Account
            </h1>

            <p className="text-sm leading-5 text-[#595F69]">
              Enter the OTP sent to your email
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
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

            <Button
              type="submit"
              loading={isSubmitting}
            >
              Verify OTP
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

export default OtpVerificationPage;