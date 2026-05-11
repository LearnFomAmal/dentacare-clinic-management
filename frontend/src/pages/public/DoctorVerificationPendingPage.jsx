import { Link, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, LockKeyhole, Stethoscope } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { doctorVerificationSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";

function DoctorVerificationPendingPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(doctorVerificationSchema),
    defaultValues: {
      email: "",
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    console.log("Doctor verification data:", data);

    // API integration later:
    // POST /doctors/verify-account

    navigate(ROUTES.LOGIN);
  };

  const handleResendOtp = async () => {
    console.log("Resend doctor verification OTP");

    // API integration later:
    // POST /doctors/resend-verification-otp
  };

  return (
    <AuthLayout>
      <Card className="mx-auto">
        <div className="space-y-10">
          <div className="space-y-2 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
              <Stethoscope size={28} />
            </div>

            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Verify Doctor Account
            </h1>

            <p className="text-sm leading-5 text-[#595F69]">
              Enter your email, OTP, and create your password
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
              placeholder="doctor@example.com"
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
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              register={register}
              error={errors.confirmPassword}
              icon={LockKeyhole}
            />

            <Button
              type="submit"
              loading={isSubmitting}
            >
              Verify Account
            </Button>
          </form>

          <div className="space-y-3 text-center text-sm">
            <button
              type="button"
              onClick={handleResendOtp}
              className="font-bold text-[#4C59A6] hover:underline"
            >
              Resend OTP
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

export default DoctorVerificationPendingPage;