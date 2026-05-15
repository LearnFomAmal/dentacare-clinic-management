import { useEffect, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Stethoscope, Wallet } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { ROUTES } from "../../constants/routes";
import { editConsultationFeeSchema } from "../../schemas/admin.schema";

import {
  getDoctorDetailsApi,
  updateDoctorConsultationFeeApi,
} from "../../features/admin/doctorManagementService";

function AdminEditDoctorFeePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(editConsultationFeeSchema),
    defaultValues: {
      consultationFee: 0,
    },
  });

  const fetchDoctorDetails = async () => {
    try {
      setIsLoading(true);

      const response = await getDoctorDetailsApi(id);
      const data = response.data;

      setDoctor(data);

      reset({
        consultationFee: data?.consultationFee ?? 0,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch doctor details";

      toast.error(message);

      navigate(ROUTES.ADMIN_DOCTORS, {
        replace: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorDetails();
  }, [id]);

  const onSubmit = async (data) => {
    try {
      const response = await updateDoctorConsultationFeeApi(
        id,
        Number(data.consultationFee)
      );

      toast.success(response.message || "Consultation fee updated");

      navigate(ROUTES.ADMIN_DOCTOR_DETAILS.replace(":id", id), {
        replace: true,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update consultation fee";

      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Consultation Fee">
        <SettingsSection title="Loading">
          <p className="text-sm text-[#595F69]">
            Loading doctor fee details...
          </p>
        </SettingsSection>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Consultation Fee">
      <div className="mb-6">
        <Link
          to={ROUTES.ADMIN_DOCTOR_DETAILS.replace(":id", id)}
          className="inline-flex items-center gap-2 text-sm font-bold text-[#4C59A6] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to doctor details
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.2fr]">
        <SettingsSection
          title="Current Doctor Details"
          description="Review current details before changing fee."
        >
          <div className="space-y-4">
            <InfoCard
              icon={Stethoscope}
              label="Doctor"
              value={doctor?.name || "Doctor"}
            />

            <InfoCard
              icon={BriefcaseBusiness}
              label="Experience"
              value={`${doctor?.experience ?? 0} years`}
            />

            <InfoCard
              icon={Wallet}
              label="Current Fee"
              value={`₹${doctor?.consultationFee ?? 0}`}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Update Consultation Fee"
          description="Only admin can modify doctor consultation fee."
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <Input
              label="New Consultation Fee"
              type="number"
              name="consultationFee"
              placeholder="500"
              register={register}
              error={errors.consultationFee}
              icon={Wallet}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              fullWidth={false}
              className="min-w-[190px]"
            >
              Save Changes
            </Button>
          </form>
        </SettingsSection>
      </div>
    </DashboardLayout>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[rgba(172,178,189,0.15)] bg-[#F8FAFC] p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF]/40 text-[#4C59A6]">
        <Icon size={20} />
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.6px] text-[#595F69]">
        {label}
      </p>

      <p className="mt-1 break-words font-semibold text-[#2D333B]">
        {value}
      </p>
    </div>
  );
}

export default AdminEditDoctorFeePage;