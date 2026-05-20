import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, UserRound, Stethoscope, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import PasswordInput from "../../components/ui/PasswordInput";
import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { loginSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";
import { loginApi } from "../../features/auth/authService";
import {
  clearAuthStorage,
  saveAccountType,
  saveAuthUser,
} from "../../utils/authStorage";
import { applyTheme } from "../../utils/themeStorage";
function LoginPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      accountType: "patient",
      email: "",
      password: "",
    },
  });

  const selectedAccountType = watch("accountType");

 const onSubmit = async (data) => {
  try {
    // Clear old frontend auth before new login
   // Clear only this role before replacing this role's session.
// Do not clear admin/doctor/patient sessions from other tabs.
clearAuthStorage(data.accountType);

  const response = await loginApi(data);


    const expectedRole = data.accountType;

    const backendUser = response.data || {};

    const normalizedUser = {
      ...backendUser,
      email: backendUser.email || data.email,
      role: backendUser.role || expectedRole,
      accountType: expectedRole,
    };

   saveAccountType(expectedRole);
   saveAuthUser(normalizedUser, expectedRole);
   applyTheme(response?.data?.theme || response?.data?.settings?.theme || "light");
    toast.success(response.message || "Login successful");

    if (expectedRole === "admin") {
      navigate(ROUTES.ADMIN_PROFILE, { replace: true });
      return;
    }

    if (expectedRole === "doctor") {
      navigate(ROUTES.DOCTOR_SETTINGS, { replace: true });
      return;
    }

    navigate(ROUTES.USER_SETTINGS, { replace: true });
  } catch (error) {
  const message =
    error?.response?.data?.message ||
    error?.message ||
    "Login failed";

  if (
    data.accountType === "doctor" &&
    message.toLowerCase().includes("verify")
  ) {
    toast.error("Please verify your doctor account first");

    navigate(ROUTES.DOCTOR_VERIFY, {
      state: {
        email: data.email,
      },
    });

    return;
  }

  toast.error(message);
}
 };

  return (
    <AuthLayout>
      <Card className="mx-auto">
        <div className="space-y-10">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Login to Your Account
            </h1>

            <p className="text-sm leading-5 text-[#595F69]">
              Access your appointments and records
            </p>
          </div>

          {/* Account Type */}
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

          {errors.accountType && (
            <p className="-mt-7 text-center text-xs font-medium text-red-500">
              {errors.accountType.message}
            </p>
          )}

          {/* Form */}
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
                  Password
                </label>

                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  state={{
                    accountType: selectedAccountType,
                  }}
                  className="text-xs font-bold text-[#4C59A6] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <PasswordInput
            //  label="Password"
            name="password"
            placeholder="••••••••"
            register={register}
             error={errors.password}
              /> 
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="mt-2"
            >
              Login
            </Button>
          </form>

          {/* Footer */}
          {selectedAccountType === "patient" && (
            <div className="flex justify-center gap-1 text-sm">
              <span className="text-[#595F69]">
                Don't have an account?
              </span>

              <Link
                to={ROUTES.REGISTER}
                className="font-bold text-[#4C59A6] hover:underline"
              >
                Register
              </Link>
            </div>
          )}

          {selectedAccountType === "doctor" && (
            <div className="text-center text-sm">
              <Link
                to={ROUTES.DOCTOR_VERIFY}
                className="font-bold text-[#4C59A6] hover:underline"
              >
                Verify doctor account
              </Link>
            </div>
          )}
        </div>
      </Card>
    </AuthLayout>
  );
}

export default LoginPage;