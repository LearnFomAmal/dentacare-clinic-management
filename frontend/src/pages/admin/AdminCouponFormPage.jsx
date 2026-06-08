import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgePercent,
  CalendarDays,
  IndianRupee,
  Percent,
  TicketPercent,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import DashboardLayout from "../../components/layout/DashboardLayout";
import SettingsSection from "../../components/common/SettingsSection";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";

import { ROUTES } from "../../constants/routes";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getActiveSpecialtiesApi } from "../../features/admin/specialtyService";

import {
  clearCouponError,
  clearSelectedCoupon,
  createCoupon,
  fetchAdminCouponDetails,
  updateCoupon,
} from "../../features/coupon/couponSlice";

const toDatetimeLocalValue = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
};

const toISOStringFromLocal = (value) => {
  if (!value) return "";

  return new Date(value).toISOString();
};

const normalizeSpecialtiesResponse = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.specialties)) {
    return data.specialties;
  }

  return [];
};

function useActiveSpecialties() {
  const [specialties, setSpecialties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSpecialties = async () => {
      try {
        setIsLoading(true);

        const response = await getActiveSpecialtiesApi();

        if (!isMounted) return;

        setSpecialties(normalizeSpecialtiesResponse(response));
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch active specialties";

        toast.error(message);

        if (isMounted) {
          setSpecialties([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSpecialties();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    specialties,
    isLoading,
  };
}

function AdminCouponFormPage() {
  const { couponId } = useParams();
  const isEditMode = Boolean(couponId);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedCoupon, isLoading, isSaving, error } = useAppSelector(
    (state) => state.coupons
  );

  const specialtiesState = useActiveSpecialties();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: "",
      title: "",
      description: "",
      discountType: "flat",
      discountValue: "",
      maxDiscount: "",
      minAmount: "0",
      applicableSpecialtyId: "",
      validFrom: "",
      validTo: "",
      maxUsage: "0",
      maxUsagePerUser: "1",
      autoApply: false,
      isActive: true,
    },
  });

  const discountType = watch("discountType");

  useEffect(() => {
    dispatch(clearSelectedCoupon());

    if (isEditMode && couponId) {
      dispatch(fetchAdminCouponDetails(couponId));
    }
  }, [dispatch, couponId, isEditMode]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearCouponError());
  }, [error, dispatch]);

  useEffect(() => {
    if (!isEditMode || !selectedCoupon) return;

    reset({
      code: selectedCoupon.code || "",
      title: selectedCoupon.title || "",
      description: selectedCoupon.description || "",
      discountType: selectedCoupon.discountType || "flat",
      discountValue: selectedCoupon.discountValue ?? "",
      maxDiscount: selectedCoupon.maxDiscount ?? "",
      minAmount: selectedCoupon.minAmount ?? "0",
      applicableSpecialtyId:
        selectedCoupon.applicableSpecialtyId?._id ||
        selectedCoupon.applicableSpecialtyId ||
        "",
      validFrom: toDatetimeLocalValue(selectedCoupon.validFrom),
      validTo: toDatetimeLocalValue(selectedCoupon.validTo),
      maxUsage: selectedCoupon.maxUsage ?? "0",
      maxUsagePerUser: selectedCoupon.maxUsagePerUser ?? "1",
      autoApply: Boolean(selectedCoupon.autoApply),
      isActive: Boolean(selectedCoupon.isActive),
    });
  }, [isEditMode, selectedCoupon, reset]);

  const validatePayload = (data) => {
    if (!data.code.trim()) {
      return "Coupon code is required";
    }

    if (!data.title.trim()) {
      return "Coupon title is required";
    }

    if (!["flat", "percentage"].includes(data.discountType)) {
      return "Select valid discount type";
    }

    if (Number(data.discountValue) <= 0) {
      return "Discount value must be greater than 0";
    }

    if (
      data.discountType === "percentage" &&
      Number(data.discountValue) > 100
    ) {
      return "Percentage discount cannot exceed 100";
    }

    if (Number(data.maxDiscount || 0) < 0) {
      return "Max discount cannot be negative";
    }

    if (Number(data.minAmount || 0) < 0) {
      return "Minimum amount cannot be negative";
    }

    if (!data.validFrom || !data.validTo) {
      return "Validity dates are required";
    }

    if (new Date(data.validFrom) >= new Date(data.validTo)) {
      return "Valid to date must be after valid from date";
    }

    if (Number(data.maxUsage || 0) < 0) {
      return "Max usage cannot be negative";
    }

    if (Number(data.maxUsagePerUser || 1) < 1) {
      return "Max usage per user must be at least 1";
    }

    return "";
  };

  const onSubmit = async (data) => {
    const validationError = validatePayload(data);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = {
      code: data.code.trim().toUpperCase(),
      title: data.title.trim(),
      description: data.description.trim(),
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      maxDiscount: Number(data.maxDiscount || 0),
      minAmount: Number(data.minAmount || 0),
      applicableSpecialtyId: data.applicableSpecialtyId || null,
      validFrom: toISOStringFromLocal(data.validFrom),
      validTo: toISOStringFromLocal(data.validTo),
      maxUsage: Number(data.maxUsage || 0),
      maxUsagePerUser: Number(data.maxUsagePerUser || 1),
      autoApply: Boolean(data.autoApply),
      isActive: Boolean(data.isActive),
    };

    try {
      const result = isEditMode
        ? await dispatch(
            updateCoupon({
              couponId,
              payload,
            })
          ).unwrap()
        : await dispatch(createCoupon(payload)).unwrap();

      toast.success(
        result.message ||
          (isEditMode
            ? "Coupon updated successfully"
            : "Coupon created successfully")
      );

      navigate(ROUTES.ADMIN_COUPONS, {
        replace: true,
      });
    } catch (err) {
      toast.error(err || "Failed to save coupon");
    }
  };

  return (
    <DashboardLayout title={isEditMode ? "Edit Coupon" : "Add Coupon"}>
      <main className="mx-auto max-w-[1080px] px-6 py-8">
        <div className="mb-6">
          <Link
            to={ROUTES.ADMIN_COUPONS}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#4C59A6] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to coupons
          </Link>
        </div>

        <SettingsSection
          title={isEditMode ? "Edit Coupon" : "Create Coupon"}
          description="Create global or specialty-specific discount coupons for appointment bookings."
        >
          {isEditMode && isLoading ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-center text-sm font-bold text-[#6B7280]">
              Loading coupon details...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Coupon Code"
                  name="code"
                  placeholder="DENTAL100"
                  register={register}
                  error={errors.code}
                  icon={TicketPercent}
                />

                <Input
                  label="Title"
                  name="title"
                  placeholder="Dental Checkup Offer"
                  register={register}
                  error={errors.title}
                  icon={BadgePercent}
                />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-[#111827]">
                    Description
                  </label>

                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Short description about this coupon..."
                    className="w-full resize-none rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
                  />
                </div>

                <Select
                  label="Discount Type"
                  name="discountType"
                  register={register}
                  error={errors.discountType}
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percentage">Percentage</option>
                </Select>

                <Input
                  label={
                    discountType === "percentage"
                      ? "Discount Percentage"
                      : "Discount Amount"
                  }
                  type="number"
                  name="discountValue"
                  placeholder={discountType === "percentage" ? "20" : "100"}
                  register={register}
                  error={errors.discountValue}
                  icon={discountType === "percentage" ? Percent : IndianRupee}
                  min="1"
                  max={discountType === "percentage" ? "100" : "10000"}
                />

                <Input
                  label="Max Discount"
                  type="number"
                  name="maxDiscount"
                  placeholder="500"
                  register={register}
                  error={errors.maxDiscount}
                  icon={IndianRupee}
                  min="0"
                />

                <Input
                  label="Minimum Appointment Amount"
                  type="number"
                  name="minAmount"
                  placeholder="300"
                  register={register}
                  error={errors.minAmount}
                  icon={IndianRupee}
                  min="0"
                />

                <Select
                  label="Applicable Specialty"
                  name="applicableSpecialtyId"
                  register={register}
                  error={errors.applicableSpecialtyId}
                  disabled={specialtiesState.isLoading}
                >
                  <option value="">All Specialties</option>

                  {specialtiesState.specialties.map((specialty) => (
                    <option key={specialty._id} value={specialty._id}>
                      {specialty.displayName || specialty.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Max Total Usage"
                  type="number"
                  name="maxUsage"
                  placeholder="100"
                  register={register}
                  error={errors.maxUsage}
                  min="0"
                />

                <Input
                  label="Max Usage Per User"
                  type="number"
                  name="maxUsagePerUser"
                  placeholder="1"
                  register={register}
                  error={errors.maxUsagePerUser}
                  min="1"
                />

                <Input
                  label="Valid From"
                  type="datetime-local"
                  name="validFrom"
                  register={register}
                  error={errors.validFrom}
                  icon={CalendarDays}
                />

                <Input
                  label="Valid To"
                  type="datetime-local"
                  name="validTo"
                  register={register}
                  error={errors.validTo}
                  icon={CalendarDays}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">
                      Auto Apply
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#6B7280]">
                      Useful later for banners or automatic offers.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    {...register("autoApply")}
                    className="h-5 w-5 accent-[#9381FF]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">
                      Active
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#6B7280]">
                      Only active coupons are visible to patients.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    {...register("isActive")}
                    className="h-5 w-5 accent-[#9381FF]"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
                <p className="text-sm font-extrabold text-[#111827]">
                  Usage Logic
                </p>

                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Set <strong>Max Total Usage</strong> to 0 for unlimited total
                  usage. Set <strong>Max Usage Per User</strong> to 3 if one
                  patient can use the same coupon three times.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  to={ROUTES.ADMIN_COUPONS}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#E5E7EB] px-6 text-sm font-extrabold text-[#6B7280] transition hover:bg-[#F8FAFC]"
                >
                  Cancel
                </Link>

                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={isSaving || specialtiesState.isLoading}
                  fullWidth={false}
                  className="min-w-[190px]"
                >
                  {isEditMode ? "Update Coupon" : "Create Coupon"}
                </Button>
              </div>
            </form>
          )}
        </SettingsSection>
      </main>
    </DashboardLayout>
  );
}

export default AdminCouponFormPage;