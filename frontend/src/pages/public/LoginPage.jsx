import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { loginSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";

function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    console.log("Login form data:", data);

    // API integration will be added after UI pages are completed.
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
                  className="text-xs font-bold text-[#4C59A6] hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <Input
                type="password"
                name="password"
                placeholder="••••••••"
                register={register}
                error={errors.password}
                icon={Lock}
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
        </div>
      </Card>
    </AuthLayout>
  );
}

export default LoginPage;