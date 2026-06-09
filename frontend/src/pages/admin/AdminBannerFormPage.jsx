import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ImagePlus,
  Link as LinkIcon,
  Megaphone,
  TicketPercent,
  Type,
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
import { getAdminCouponsApi } from "../../features/coupon/couponService";

import {
  clearBannerError,
  clearSelectedBanner,
  createBanner,
  fetchAdminBannerDetails,
  updateBanner,
} from "../../features/banner/bannerSlice";

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

const normalizeArrayResponse = (response, key) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.[key])) {
    return data[key];
  }

  return [];
};

function AdminBannerFormPage() {
  const { bannerId } = useParams();
  const isEditMode = Boolean(bannerId);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedBanner, isLoading, isSaving, error } = useAppSelector(
    (state) => state.banners
  );

  const [specialties, setSpecialties] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      type: "referral",
      locationsHome: true,
      locationsDoctors: false,
      ctaText: "View Offer",
      redirectUrl: "",
      specialtyId: "",
      couponId: "",
      couponCode: "",
      startDate: "",
      endDate: "",
      priority: "1",
      isActive: true,
    },
  });

  const bannerType = watch("type");
  const selectedCouponId = watch("couponId");

  const activeCoupons = useMemo(() => {
    return coupons.filter((coupon) => coupon.isActive);
  }, [coupons]);

  useEffect(() => {
    let isMounted = true;

    const fetchOptions = async () => {
      try {
        setIsLoadingOptions(true);

        const [specialtyResponse, couponResponse] = await Promise.all([
          getActiveSpecialtiesApi(),
          getAdminCouponsApi({
            page: 1,
            limit: 100,
            status: "active",
          }),
        ]);

        if (!isMounted) return;

        setSpecialties(normalizeArrayResponse(specialtyResponse, "specialties"));
        setCoupons(normalizeArrayResponse(couponResponse, "coupons"));
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch form options";

        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      }
    };

    fetchOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    dispatch(clearSelectedBanner());

    if (isEditMode && bannerId) {
      dispatch(fetchAdminBannerDetails(bannerId));
    }
  }, [dispatch, isEditMode, bannerId]);

  useEffect(() => {
    if (!error) return;

    toast.error(error);
    dispatch(clearBannerError());
  }, [error, dispatch]);

  useEffect(() => {
    if (!isEditMode || !selectedBanner) return;

    reset({
      title: selectedBanner.title || "",
      description: selectedBanner.description || "",
      type: selectedBanner.type || "referral",
      locationsHome: selectedBanner.locations?.includes("home") || false,
      locationsDoctors: selectedBanner.locations?.includes("doctors") || false,
      ctaText: selectedBanner.ctaText || "View Offer",
      redirectUrl: selectedBanner.redirectUrl || "",
      specialtyId:
        selectedBanner.specialtyId?._id ||
        selectedBanner.specialty?._id ||
        selectedBanner.specialtyId ||
        "",
      couponId:
        selectedBanner.couponId?._id ||
        selectedBanner.coupon?._id ||
        selectedBanner.couponId ||
        "",
      couponCode: selectedBanner.couponCode || "",
      startDate: toDatetimeLocalValue(selectedBanner.startDate),
      endDate: toDatetimeLocalValue(selectedBanner.endDate),
      priority: selectedBanner.priority || "1",
      isActive: Boolean(selectedBanner.isActive),
    });

    setPreviewUrl(selectedBanner.imageUrl || "");
  }, [isEditMode, selectedBanner, reset]);

  useEffect(() => {
    if (!selectedCouponId) return;

    const coupon = coupons.find((item) => item._id === selectedCouponId);

    if (coupon?.code) {
      setValue("couponCode", coupon.code);
    }

    if (coupon?.applicableSpecialtyId) {
      const specialtyId =
        coupon.applicableSpecialtyId?._id || coupon.applicableSpecialtyId;

      setValue("specialtyId", specialtyId);
    }
  }, [selectedCouponId, coupons, setValue]);

  useEffect(() => {
    if (bannerType === "referral") {
      setValue("locationsHome", true);
      setValue("locationsDoctors", false);
      setValue("specialtyId", "");
      setValue("couponId", "");
      setValue("couponCode", "");
      setValue("redirectUrl", "/referral");
    }

    if (bannerType === "specialty_coupon") {
      setValue("locationsHome", true);
      setValue("locationsDoctors", true);
    }
  }, [bannerType, setValue]);

  useEffect(() => {
    return () => {
      if (previewUrl && selectedImageFile) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, selectedImageFile]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG and WEBP images are allowed");
      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Banner image must be less than 3MB");
      event.target.value = "";
      return;
    }

    if (previewUrl && selectedImageFile) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const validatePayload = (data) => {
    if (!data.title.trim()) {
      return "Banner title is required";
    }

    if (!data.startDate || !data.endDate) {
      return "Banner start and end dates are required";
    }

    if (new Date(data.startDate) >= new Date(data.endDate)) {
      return "End date must be after start date";
    }

    const locations = [];

    if (data.locationsHome) locations.push("home");
    if (data.locationsDoctors) locations.push("doctors");

    if (!locations.length) {
      return "Select at least one banner location";
    }

    if (data.type === "referral" && data.locationsDoctors) {
      return "Referral banner can be shown only on home page";
    }

    if (data.type === "specialty_coupon") {
      if (!data.specialtyId) {
        return "Select specialty for specialty coupon banner";
      }

      if (!data.couponId) {
        return "Select coupon for specialty coupon banner";
      }

      if (!data.couponCode.trim()) {
        return "Coupon code is required";
      }
    }

    if (!isEditMode && !selectedImageFile) {
      return "Banner image is required";
    }

    return "";
  };

  const onSubmit = async (data) => {
    const validationError = validatePayload(data);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const locations = [];

    if (data.locationsHome) locations.push("home");
    if (data.locationsDoctors) locations.push("doctors");

    const formData = new FormData();

    formData.append("title", data.title.trim());
    formData.append("description", data.description.trim());
    formData.append("type", data.type);
    formData.append("locations", JSON.stringify(locations));
    formData.append("ctaText", data.ctaText.trim() || "View Offer");
    formData.append("redirectUrl", data.redirectUrl.trim());
    formData.append("startDate", toISOStringFromLocal(data.startDate));
    formData.append("endDate", toISOStringFromLocal(data.endDate));
    formData.append("priority", Number(data.priority || 1));
    formData.append("isActive", Boolean(data.isActive));

    if (data.type === "specialty_coupon") {
      formData.append("specialtyId", data.specialtyId);
      formData.append("couponId", data.couponId);
      formData.append("couponCode", data.couponCode.trim().toUpperCase());
    }

    if (selectedImageFile) {
      formData.append("bannerImage", selectedImageFile);
    }

    try {
      const result = isEditMode
        ? await dispatch(
            updateBanner({
              bannerId,
              formData,
            })
          ).unwrap()
        : await dispatch(createBanner(formData)).unwrap();

      toast.success(
        result.message ||
          (isEditMode
            ? "Banner updated successfully"
            : "Banner created successfully")
      );

      navigate(ROUTES.ADMIN_BANNERS, {
        replace: true,
      });
    } catch (err) {
      toast.error(err || "Failed to save banner");
    }
  };

  return (
    <DashboardLayout title={isEditMode ? "Edit Banner" : "Add Banner"}>
      <main className="mx-auto max-w-[1080px] px-6 py-8">
        <div className="mb-6">
          <Link
            to={ROUTES.ADMIN_BANNERS}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#4C59A6] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to banners
          </Link>
        </div>

        <SettingsSection
          title={isEditMode ? "Edit Banner" : "Create Banner"}
          description="Create referral and specialty coupon banners for patient-facing pages."
        >
          {isEditMode && isLoading ? (
            <div className="rounded-2xl bg-[#F8FAFC] p-8 text-center text-sm font-bold text-[#6B7280]">
              Loading banner details...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Banner Title"
                  name="title"
                  placeholder="Invite Friends & Earn Rewards"
                  register={register}
                  error={errors.title}
                  icon={Type}
                />

                <Select
                  label="Banner Type"
                  name="type"
                  register={register}
                  error={errors.type}
                >
                  <option value="referral">Referral Banner</option>
                  <option value="specialty_coupon">
                    Specialty Coupon Banner
                  </option>
                </Select>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-[#111827]">
                    Description
                  </label>

                  <textarea
                    {...register("description")}
                    rows={3}
                    placeholder="Short description about this banner..."
                    className="w-full resize-none rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
                  />
                </div>

                <Input
                  label="CTA Text"
                  name="ctaText"
                  placeholder="View Offer"
                  register={register}
                  error={errors.ctaText}
                  icon={Megaphone}
                />

                <Input
                  label="Redirect URL"
                  name="redirectUrl"
                  placeholder="/referral or /doctors?specialty=..."
                  register={register}
                  error={errors.redirectUrl}
                  icon={LinkIcon}
                />

                {bannerType === "specialty_coupon" && (
                  <>
                    <Select
                      label="Specialty"
                      name="specialtyId"
                      register={register}
                      error={errors.specialtyId}
                      disabled={isLoadingOptions}
                    >
                      <option value="">Select specialty</option>

                      {specialties.map((specialty) => (
                        <option key={specialty._id} value={specialty._id}>
                          {specialty.displayName || specialty.name}
                        </option>
                      ))}
                    </Select>

                    <Select
                      label="Coupon"
                      name="couponId"
                      register={register}
                      error={errors.couponId}
                      disabled={isLoadingOptions}
                    >
                      <option value="">Select coupon</option>

                      {activeCoupons.map((coupon) => (
                        <option key={coupon._id} value={coupon._id}>
                          {coupon.code} — {coupon.title}
                        </option>
                      ))}
                    </Select>

                    <Input
                      label="Coupon Code"
                      name="couponCode"
                      placeholder="SMILE20"
                      register={register}
                      error={errors.couponCode}
                      icon={TicketPercent}
                    />
                  </>
                )}

                <Input
                  label="Start Date"
                  type="datetime-local"
                  name="startDate"
                  register={register}
                  error={errors.startDate}
                  icon={CalendarDays}
                />

                <Input
                  label="End Date"
                  type="datetime-local"
                  name="endDate"
                  register={register}
                  error={errors.endDate}
                  icon={CalendarDays}
                />

                <Input
                  label="Priority"
                  type="number"
                  name="priority"
                  placeholder="1"
                  register={register}
                  error={errors.priority}
                  min="1"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">
                      Show on Home
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#6B7280]">
                      Display in home page banner carousel.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    {...register("locationsHome")}
                    className="h-5 w-5 accent-[#9381FF]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">
                      Show on Doctors
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#6B7280]">
                      Only specialty coupon banners should use this.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    {...register("locationsDoctors")}
                    disabled={bannerType === "referral"}
                    className="h-5 w-5 accent-[#9381FF] disabled:opacity-40"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
                  <div>
                    <p className="text-sm font-extrabold text-[#111827]">
                      Active
                    </p>

                    <p className="mt-1 text-xs font-medium text-[#6B7280]">
                      Only active banners are visible.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    {...register("isActive")}
                    className="h-5 w-5 accent-[#9381FF]"
                  />
                </label>
              </div>

              <div className="rounded-3xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
                <label className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#111827]">
                  <ImagePlus size={18} className="text-[#9381FF]" />
                  Banner Image
                </label>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm font-semibold text-[#6B7280] file:mr-4 file:rounded-xl file:border-0 file:bg-[#9381FF] file:px-5 file:py-3 file:text-sm file:font-bold file:text-white"
                />

                <p className="mt-2 text-xs font-semibold text-[#9CA3AF]">
                  Recommended size: 1200 × 450px. Max file size: 3MB.
                </p>

                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Banner preview"
                    className="mt-5 h-[240px] w-full rounded-3xl object-cover"
                  />
                )}
              </div>

              <div className="rounded-2xl border border-[#EEF0F6] bg-[#F8FAFC] p-5">
                <p className="text-sm font-extrabold text-[#111827]">
                  Banner Flow
                </p>

                <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                  Referral banners redirect patients to the referral page.
                  Specialty coupon banners redirect patients to the find doctors
                  page with specialty and coupon query parameters.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  to={ROUTES.ADMIN_BANNERS}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#E5E7EB] px-6 text-sm font-extrabold text-[#6B7280] transition hover:bg-[#F8FAFC]"
                >
                  Cancel
                </Link>

                <Button
                  type="submit"
                  loading={isSaving}
                  disabled={isSaving || isLoadingOptions}
                  fullWidth={false}
                  className="min-w-[190px]"
                >
                  {isEditMode ? "Update Banner" : "Create Banner"}
                </Button>
              </div>
            </form>
          )}
        </SettingsSection>
      </main>
    </DashboardLayout>
  );
}

export default AdminBannerFormPage;