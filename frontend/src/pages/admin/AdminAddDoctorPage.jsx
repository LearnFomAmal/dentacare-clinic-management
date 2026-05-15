import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  GraduationCap,
  Mail,
  Phone,
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
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(createDoctorSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      specializationId: "",
      experience: 0,
      education: "",
      consultationFee: 0,
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
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        specializationId: data.specializationId,
        experience: Number(data.experience),
        education: data.education,
        consultationFee: Number(data.consultationFee),
        contactNumber: data.contactNumber,
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
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
            >
              <option value="">
                {isLoadingSpecialties
                  ? "Loading specialties..."
                  : "Select Specialty"}
              </option>

              {specialties.map((specialty) => (
                <option
                  key={specialty._id}
                  value={specialty._id}
                >
                  {specialty.displayName ||
                    specialty.name}
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
            />
          </div>

          <div className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5">
            <div className="mb-2 flex items-center gap-2 font-semibold text-[#2D333B]">
              <Stethoscope size={18} className="text-[#4C59A6]" />
              Doctor Verification Flow
            </div>

            <p className="text-sm leading-6 text-[#595F69]">
              After creating the doctor, backend will generate a temporary password and OTP, then send both to the doctor email. Doctor must verify account and set a new password before login.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={isSubmitting}
              fullWidth={false}
              className="min-w-[190px]"
            >
              Create Doctor
            </Button>
          </div>
        </form>
      </SettingsSection>
    </DashboardLayout>
  );
}

export default AdminAddDoctorPage;