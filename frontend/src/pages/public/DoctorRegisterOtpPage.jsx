import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";
import { ROUTES } from "../../constants/routes";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";

const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

function DoctorRegisterOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const validateEmailAndOtp = () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error("OTP must be 6 digits");
      return false;
    }

    return true;
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!validateEmailAndOtp()) return;

    try {
      setIsVerifying(true);

      const response = await axiosInstance.post(
        API_ENDPOINTS.DOCTOR.REGISTER_VERIFY_OTP,
        {
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }
      );

      toast.success(
        response?.data?.message ||
          "Doctor email verified successfully"
      );

      navigate(ROUTES.LOGIN, {
        replace: true,
        state: {
          accountType: "doctor",
          email: email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "OTP verification failed"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setIsResending(true);

      const response = await axiosInstance.post(
        API_ENDPOINTS.DOCTOR.REGISTER_RESEND_OTP,
        {
          email: email.trim().toLowerCase(),
        }
      );

      toast.success(response?.data?.message || "OTP resent successfully");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to resend OTP"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#B8B8FF]/40 text-[#4C59A6]">
              <ShieldCheck size={30} />
            </div>

            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Verify Doctor Email
            </h1>

            <p className="text-sm leading-6 text-[#595F69]">
              Enter the OTP sent to your email. After verification, login and
              upload your certificates for admin approval.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#595F69]">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B93A5]"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="doctor@example.com"
                  className="h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white pl-11 pr-4 text-sm font-semibold text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#595F69]">
                OTP
              </label>

              <input
                type="text"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6 digit OTP"
                className="h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white px-4 text-center text-lg font-extrabold tracking-[6px] text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="h-12 w-full rounded-2xl bg-[#4C59A6] text-sm font-extrabold text-white transition hover:bg-[#404b91] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </button>
          </form>

          <div className="space-y-3 text-center text-sm">
            <button
              type="button"
              disabled={isResending}
              onClick={handleResendOtp}
              className="font-bold text-[#4C59A6] hover:underline disabled:opacity-60"
            >
              {isResending ? "Resending..." : "Resend OTP"}
            </button>

            <div>
              <Link
                to={ROUTES.DOCTOR_REGISTER}
                className="font-bold text-[#4C59A6] hover:underline"
              >
                Back to doctor registration
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}

export default DoctorRegisterOtpPage;