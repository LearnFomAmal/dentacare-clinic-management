import { Link, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import PasswordInput from "../../components/ui/PasswordInput";
import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAppDispatch } from "../../app/hooks";
import { loginUser } from "../../features/auth/authSlice";
import { loginSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";
import { applyTheme } from "../../utils/themeStorage";

function AdminLoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      accountType: "admin",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const result = await dispatch(
        loginUser({
          ...data,
          accountType: "admin",
        })
      ).unwrap();

      applyTheme(
        result?.user?.theme ||
          result?.user?.settings?.theme ||
          "light"
      );

      toast.success(result.message || "Admin login successful");

      navigate(result.redirectTo, {
        replace: true,
      });
    } catch (error) {
      toast.error(error?.message || "Admin login failed");
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto">
        <div className="space-y-10">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
              <ShieldCheck size={26} />
            </div>

            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Admin Login
            </h1>

            <p className="text-sm leading-5 text-[#595F69]">
              Secure access for clinic administrators
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input
              type="hidden"
              value="admin"
              {...register("accountType")}
            />

            <Input
              label="Admin Email"
              type="email"
              name="email"
              placeholder="admin@example.com"
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
                    accountType: "admin",
                  }}
                  className="text-xs font-bold text-[#4C59A6] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <PasswordInput
                name="password"
                placeholder="••••••••"
                register={register}
                error={errors.password}
              />
            </div>

            <Button type="submit" loading={isSubmitting} className="mt-2">
              Login as Admin
            </Button>
          </form>

          <div className="text-center text-xs text-[#8B93A5]">
            This page is intended only for authorized DentaCare administrators.
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}

export default AdminLoginPage;