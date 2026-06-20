import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Calendar,
  Phone,
  Gift,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { registerSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";
import { registerApi } from "../../features/auth/authService";
import { savePendingRegisterEmail } from "../../utils/authStorage";

function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
      gender: "",
      phoneNumber: "",
      bloodGroup: "",
      referralCode: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        username: data.username,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        phoneNumber: data.phoneNumber,
        bloodGroup: data.bloodGroup,
      };

      if (data.referralCode?.trim()) {
        payload.referralCode = data.referralCode.trim();
      }

      const response = await registerApi(payload);

      savePendingRegisterEmail(data.email);

      toast.success(response.message || "OTP sent to email");

      navigate(ROUTES.VERIFY_OTP, {
        state: {
          email: data.email,
        },
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed";

      toast.error(message);
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto max-w-[860px]">
        <div className="space-y-7">
          <div className="space-y-2 text-center">
            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Create Your Account
            </h1>

            <p className="text-sm leading-5 text-[#595F69]">
              Register to book appointments and manage your records
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-7"
          >
            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              <Input
                label="Username"
                name="username"
                placeholder="Amal Kumar"
                register={register}
                error={errors.username}
                icon={User}
              />

              <Input
                label="Email ID"
                type="email"
                name="email"
                placeholder="john@example.com"
                register={register}
                error={errors.email}
                icon={Mail}
              />

  <Input
  label="Password"
  type="password"
  name="password"
  placeholder="••••••••"
  register={register}
  error={errors.password}
  icon={Lock}
  showPasswordToggle
/>

<Input
  label="Confirm Password"
  type="password"
  name="confirmPassword"
  placeholder="••••••••"
  register={register}
  error={errors.confirmPassword}
  icon={Lock}
  showPasswordToggle
/>
              <Input
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                register={register}
                error={errors.dateOfBirth}
                icon={Calendar}
              />

              <div className="w-full space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
                  Gender
                </label>

                <select
                  {...register("gender")}
                  className={`h-[49px] w-full rounded-lg border bg-white px-4 text-sm text-[#2D333B] outline-none transition-all duration-200 focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 ${
                    errors.gender
                      ? "border-red-500"
                      : "border-[rgba(172,178,189,0.2)]"
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>

                {errors.gender && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              <Input
                label="Phone Number"
                name="phoneNumber"
                placeholder="9876543210"
                register={register}
                error={errors.phoneNumber}
                icon={Phone}
              />

              <div className="w-full space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
                  Blood Group
                </label>

                <select
                  {...register("bloodGroup")}
                  className={`h-[49px] w-full rounded-lg border bg-white px-4 text-sm text-[#2D333B] outline-none transition-all duration-200 focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 ${
                    errors.bloodGroup
                      ? "border-red-500"
                      : "border-[rgba(172,178,189,0.2)]"
                  }`}
                >
                  <option value="">Select Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>

                {errors.bloodGroup && (
                  <p className="text-xs font-medium text-red-500">
                    {errors.bloodGroup.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mx-auto max-w-[520px] rounded-2xl border border-[rgba(172,178,189,0.2)] bg-[#F8FAFC] p-4">
              <Input
                label="Referral Code Optional"
                name="referralCode"
                placeholder="DENTA99X"
                register={register}
                error={errors.referralCode}
                icon={Gift}
              />

              <p className="mt-2 text-xs font-medium text-[#4C59A6]">
                Referral code is optional.
              </p>
            </div>

            <div className="mx-auto max-w-[380px]">
              <Button type="submit" loading={isSubmitting}>
                Register
              </Button>
            </div>
          </form>

          <div className="flex justify-center gap-1 text-sm">
            <span className="text-[#595F69]">
              Already have an account?
            </span>

            <Link
              to={ROUTES.LOGIN}
              className="font-bold text-[#4C59A6] hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}

export default RegisterPage;