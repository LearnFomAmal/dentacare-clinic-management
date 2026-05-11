import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { forgotPasswordSchema } from "../../schemas/auth.schema";
import { ROUTES } from "../../constants/routes";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data) => {
    console.log("Forgot password data:", data);

    // API integration later:
    // Patient: POST /auth/forgot-password
    // Doctor: POST /doctors/forgot-password
    // Admin: POST /admin/forgot-password

    navigate(ROUTES.RESET_PASSWORD, {
      state: {
        email: data.email,
      },
    });
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
              Enter your email and we will send an OTP to reset your password
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

            <Button
              type="submit"
              loading={isSubmitting}
            >
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