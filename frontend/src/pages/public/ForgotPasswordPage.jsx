import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  KeyRound,
  UserRound,
  Stethoscope,
  ShieldCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { forgotPasswordSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";
import { forgotPasswordApi } from "../../features/auth/authService";
import { savePendingForgotPasswordData } from "../../utils/authStorage";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const accountTypeFromLogin = location.state?.accountType || "patient";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      accountType: accountTypeFromLogin,
      email: "",
    },
  });

  const selectedAccountType = watch("accountType");

  const onSubmit = async (data) => {
    try {
      const response = await forgotPasswordApi(data);

      savePendingForgotPasswordData({
        accountType: data.accountType,
        email: data.email,
      });

      toast.success(response?.message || "OTP sent successfully");

      navigate(ROUTES.RESET_PASSWORD, {
        state: {
          accountType: data.accountType,
          email: data.email,
        },
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to send OTP";

      toast.error(message);
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto">
        <div className="space-y-10">
          <div className="space-y-2 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
              <KeyRound size={28} />
            </div>

            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Forgot Password?
            </h1>

            <p className="text-sm leading-5 text-[#595F69]">
              Select account type and enter your email to receive an OTP
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
              <ShieldCheck size={18} />
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

            <Button type="submit" loading={isSubmitting}>
              Send OTP
            </Button>
          </form>

          <div className="text-center text-sm">
            <Link
              to={ROUTES.LOGIN}
              className="font-bold text-[#4C59A6] hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;