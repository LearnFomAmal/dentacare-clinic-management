import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../api/endpoints";
import { ROUTES } from "../../constants/routes";

import AuthLayout from "../../components/layout/AuthLayout";
import Card from "../../components/ui/Card";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  specializationId: "",
  experience: "",
  education: "",
  contactNumber: "",
};
const getErrorMessage = (error, fallback) => {
  return error?.response?.data?.message || error?.message || fallback;
};

function DoctorRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [specialties, setSpecialties] = useState([]);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSpecialties = async () => {
    try {
      setIsLoadingSpecialties(true);

      const response = await axiosInstance.get(
        API_ENDPOINTS.SPECIALTY.GET_ACTIVE_PUBLIC
      );

      const data = response?.data?.data;

      if (Array.isArray(data)) {
        setSpecialties(data);
      } else if (Array.isArray(data?.specialties)) {
        setSpecialties(data.specialties);
      } else if (Array.isArray(data?.data)) {
        setSpecialties(data.data);
      } else {
        setSpecialties([]);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to fetch specialties"));
      setSpecialties([]);
    } finally {
      setIsLoadingSpecialties(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.specializationId ||
      formData.experience === "" ||
      !formData.education.trim() ||
      !formData.contactNumber.trim()
    ) {
      toast.error("All fields are required");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(formData.contactNumber.trim())) {
      toast.error("Enter a valid 10 digit Indian phone number");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        specializationId: formData.specializationId,
        experience: Number(formData.experience),
        education: formData.education.trim(),
        contactNumber: formData.contactNumber.trim(),
      };

      const response = await axiosInstance.post(
        API_ENDPOINTS.DOCTOR.REGISTER,
        payload
      );

      toast.success(
        response?.data?.message || "Doctor registration OTP sent"
      );

      navigate(ROUTES.DOCTOR_REGISTER_VERIFY_OTP, {
        replace: true,
        state: {
          email: payload.email,
        },
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Doctor registration failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="mx-auto max-w-[760px]">
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <h1 className="font-manrope text-[30px] font-extrabold leading-9 tracking-[-0.75px] text-[#2D333B]">
              Doctor Registration
            </h1>

            <p className="text-sm leading-6 text-[#595F69]">
              Register as a doctor. After email OTP verification, upload your
              certificates for admin approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                icon={UserRound}
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
              />

              <FormInput
                icon={UserRound}
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
              />
            </div>

            <FormInput
              icon={Mail}
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="doctor@example.com"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
  icon={Lock}
  label="Password"
  name="password"
  type="password"
  value={formData.password}
  onChange={handleChange}
  placeholder="Strong password"
  showPasswordToggle
/>

<FormInput
  icon={Lock}
  label="Confirm Password"
  name="confirmPassword"
  type="password"
  value={formData.confirmPassword}
  onChange={handleChange}
  placeholder="Confirm password"
  showPasswordToggle
/>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#595F69]">
                Specialty
              </label>

              <div className="relative">
                <Stethoscope
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B93A5]"
                />

                <select
                  name="specializationId"
                  value={formData.specializationId}
                  onChange={handleChange}
                  disabled={isLoadingSpecialties}
                  className="h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white pl-11 pr-4 text-sm font-semibold text-[#2D333B] outline-none transition focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 disabled:opacity-60"
                >
                  <option value="">
                    {isLoadingSpecialties
                      ? "Loading specialties..."
                      : "Select specialty"}
                  </option>

                  {specialties.map((specialty) => (
                    <option key={specialty._id} value={specialty._id}>
                      {specialty.displayName || specialty.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

           <FormInput
  icon={BriefcaseBusiness}
  label="Experience"
  name="experience"
  type="number"
  value={formData.experience}
  onChange={handleChange}
  placeholder="Years of experience"
  min="0"
  max="25"
/>

<div className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-xs font-bold leading-5 text-[#595F69]">
  Consultation fee is set to ₹500 by default. Admin can update it after
  registration.
</div>
            <FormInput
              icon={GraduationCap}
              label="Education"
              name="education"
              value={formData.education}
              onChange={handleChange}
              placeholder="Example: BDS, MDS"
            />

            <FormInput
              icon={Phone}
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="10 digit mobile number"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-[#4C59A6] text-sm font-extrabold text-white transition hover:bg-[#404b91] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending OTP..." : "Register as Doctor"}
            </button>
          </form>

          <div className="text-center text-sm">
            <span className="text-[#595F69]">Already have an account?</span>{" "}
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

function FormInput({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder = "",
  showPasswordToggle = false,
  ...props
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPasswordField = type === "password" && showPasswordToggle;

  const finalInputType = isPasswordField
    ? isPasswordVisible
      ? "text"
      : "password"
    : type;

  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.6px] text-[#595F69]">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B93A5]"
          />
        )}

        <input
          type={finalInputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`h-12 w-full rounded-2xl border border-[rgba(172,178,189,0.2)] bg-white text-sm font-semibold text-[#2D333B] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#4C59A6] focus:ring-2 focus:ring-[#4C59A6]/10 ${
            Icon ? "pl-11" : "pl-4"
          } ${isPasswordField ? "pr-12" : "pr-4"}`}
          {...props}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B93A5] transition hover:text-[#4C59A6]"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
export default DoctorRegisterPage;