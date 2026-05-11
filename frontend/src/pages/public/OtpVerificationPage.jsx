import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { otpSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";

function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromRegister = location.state?.email || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      email: emailFromRegister,
      otp: "",
    },
  });

  const onSubmit = async (data) => {
    console.log("OTP verification data:", data);

    // API integration later:
    // POST /auth/register/verify-otp

    navigate(ROUTES.LOGIN);
  };

  const handleResendOtp = async () => {
    console.log("Resend OTP for:", emailFromRegister);

    // API integration later:
    // POST /auth/register/resend-otp
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

export default OtpVerificationPage;