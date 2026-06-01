import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
  Wallet,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

import { ROUTES } from "../../constants/routes";
import { createDoctorSchema } from "../../schemas/admin.schema";

import { createDoctorApi } from "../../features/admin/doctorManagementService";
import { getActiveSpecialtiesApi } from "../../features/admin/specialtyService";

function AdminAddDoctorPage() {
  const navigate = useNavigate();

  const [specialties, setSpecialties] = useState([]);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      specializationId: "",
      experience: "",
      education: "",
      consultationFee: "",
      contactNumber: "",
    },
  });

  const fetchSpecialties = async () => {
    try {
      setIsLoadingSpecialties(true);

      const response = await getActiveSpecialtiesApi();

      setSpecialties(response.data || []);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch active specialties";

      toast.error(message);
    } finally {
      setIsLoadingSpecialties(false);
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        specializationId: data.specializationId,
        experience: Number(data.experience),
        education: data.education.trim(),
        consultationFee: Number(data.consultationFee),
        contactNumber: data.contactNumber.trim(),
      };

      const response = await createDoctorApi(payload);

      toast.success(
        response.message ||
          "Doctor created successfully. Verification email sent."
      );

      navigate(ROUTES.ADMIN_DOCTORS, {
        replace: true,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create doctor";

      toast.error(message);
    }
  };

  return (
    <DashboardLayout title="Add Doctor">
      <main className="mx-auto max-w-[1080px] px-6 py-8">
        <div className="mb-6">
          <Link
            to={ROUTES.ADMIN_DOCTORS}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#4C59A6] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to doctors
          </Link>
        </div>

        <SettingsSection
          title="Create Doctor Account"
          description="Admin creates doctor account. Doctor receives OTP and temporary password by email."
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="First Name"
                name="firstName"
                placeholder="Sarah"
                register={register}
                error={errors.firstName}
                icon={User}
              />

              <Input
                label="Last Name"
                name="lastName"
                placeholder="Jenkins"
                register={register}
                error={errors.lastName}
                icon={User}
              />

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
                label="Contact Number"
                name="contactNumber"
                placeholder="9876543210"
                register={register}
                error={errors.contactNumber}
                icon={Phone}
              />

              <Select
                label="Specialty"
                name="specializationId"
                register={register}
                error={errors.specializationId}
                disabled={isLoadingSpecialties}
              >
                <option value="">
                  {isLoadingSpecialties
                    ? "Loading specialties..."
                    : "Select Specialty"}
                </option>

                {specialties.map((specialty) => (
                  <option key={specialty._id} value={specialty._id}>
                    {specialty.displayName || specialty.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Experience"
                type="number"
                name="experience"
                placeholder="5"
                register={register}
                error={errors.experience}
                icon={BriefcaseBusiness}
                min="0"
                max="25"
              />

              <Input
                label="Education"
                name="education"
                placeholder="BDS, MDS Orthodontics"
                register={register}
                error={errors.education}
                icon={GraduationCap}
              />

              <Input
                label="Consultation Fee"
                type="number"
                name="consultationFee"
                placeholder="500"
                register={register}
                error={errors.consultationFee}
                icon={Wallet}
                min="0"
                max="10000"
              />
            </div>

            <div className="rounded-2xl border border-[rgba(172,178,189,0.18)] bg-[#F8FAFC] p-5">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#B8B8FF]/40 text-[#4C59A6]">
                  <Stethoscope size={30} />
                </div>

                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-700">
                    <ShieldCheck size={14} />
                    Account creation flow
                  </div>

                  <p className="text-sm leading-6 text-[#595F69]">
                    After creating the doctor, the backend generates a temporary
                    password and OTP, then sends both to the doctor email. The
                    doctor must verify the account and set a new password before
                    login.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                to={ROUTES.ADMIN_DOCTORS}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#E5E7EB] px-6 text-sm font-extrabold text-[#6B7280] transition hover:bg-[#F8FAFC]"
              >
                Cancel
              </Link>

              <Button
                type="submit"
                loading={isSubmitting}
                disabled={isSubmitting || isLoadingSpecialties}
                fullWidth={false}
                className="min-w-[190px]"
              >
                Create Doctor
              </Button>
            </div>
          </form>
        </SettingsSection>
      </main>
    </DashboardLayout>
  );
}

export default AdminAddDoctorPage;