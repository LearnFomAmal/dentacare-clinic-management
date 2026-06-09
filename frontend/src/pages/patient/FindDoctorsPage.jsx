import { useEffect } from "react";
import {
  BriefcaseBusiness,
  IndianRupee,
  Search,
  SlidersHorizontal,
  Star,
  Stethoscope,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import BannerCarousel from "../../components/banners/BannerCarousel";
import {
  clearBannerError,
  fetchDoctorPageBanners,
} from "../../features/banner/bannerSlice";
import PatientLayout from "../../components/patient/PatientLayout";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  clearPublicDoctorError,
  fetchPublicDoctors,
  fetchPublicSpecialties,
  setDoctorFilter,
} from "../../features/doctor/publicDoctorSlice";

function FindDoctorsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
 
  const {
    doctors,
    specialties,
    filters,
    pagination,
    isLoadingDoctors,
    isLoadingSpecialties,
    error,
  } = useAppSelector((state) => state.publicDoctors);

  const {
   doctorPageBanners,
   error: bannerError,
  } = useAppSelector((state) => state.banners);
const couponFromBanner = searchParams.get("coupon") || "";
  useEffect(() => {
    dispatch(fetchPublicSpecialties());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPublicDoctors());
  }, [
    dispatch,
    filters.search,
    filters.specialtyId,
    filters.minExperience,
    filters.sort,
    filters.page,
  ]);

 useEffect(() => {
  if (!error) return;

  toast.error(error);
  dispatch(clearPublicDoctorError());
 }, [error, dispatch]);
  

 useEffect(() => {
  dispatch(fetchDoctorPageBanners());
}, [dispatch]);

useEffect(() => {
  const specialtyId = searchParams.get("specialty");

  if (specialtyId && specialtyId !== filters.specialtyId) {
    dispatch(
      setDoctorFilter({
        name: "specialtyId",
        value: specialtyId,
      })
    );
  }
}, [dispatch, searchParams, filters.specialtyId]);

useEffect(() => {
  if (!bannerError) return;

  dispatch(clearBannerError());
}, [bannerError, dispatch]);

  const handleFilterChange = (name, value) => {
    dispatch(setDoctorFilter({ name, value }));
  };

  return (
    <PatientLayout>
      <main className="mx-auto max-w-[1120px] px-6 py-10">
        <section className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
            Find doctors
          </p>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-[-1px] text-[#111827]">
                Choose Your Dental Specialist
              </h1>

              <p className="mt-3 max-w-[620px] text-base leading-7 text-[#6B7280]">
                Browse verified dentists by specialization, experience, and
                consultation fee. Open a doctor profile to view available
                appointment slots.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-[#F8FAFC] px-5 py-3 text-sm font-bold text-[#6B7280]">
              <SlidersHorizontal size={17} />
              {pagination.totalDoctors} doctors
            </div>
            
          </div>
        </section>
   <BannerCarousel
  banners={doctorPageBanners}
  title="Specialty Offers"
  description="Use active specialty coupons while choosing your dentist."
  compact
/>
        <section className="rounded-3xl border border-[#EEF0F6] bg-white p-5 shadow-[0_18px_48px_rgba(17,24,39,0.05)]">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_170px_160px]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
              />

              <input
                type="text"
                value={filters.search}
                onChange={(event) =>
                  handleFilterChange("search", event.target.value)
                }
                placeholder="Search doctors by name or specialty"
                className="h-13 w-full rounded-2xl border border-[#E5E7EB] bg-white py-4 pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
              />
            </div>

            <select
              value={filters.specialtyId}
              onChange={(event) =>
                handleFilterChange("specialtyId", event.target.value)
              }
              disabled={isLoadingSpecialties}
              className="h-13 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 text-sm font-bold text-[#374151] outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
            >
              <option value="">All Specializations</option>
              {specialties.map((specialty) => (
                <option key={specialty._id} value={specialty._id}>
                  {specialty.displayName || specialty.name}
                </option>
              ))}
            </select>

            <select
              value={filters.minExperience}
              onChange={(event) =>
                handleFilterChange("minExperience", event.target.value)
              }
              className="h-13 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 text-sm font-bold text-[#374151] outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
            >
              <option value="">Experience</option>
              <option value="0">0+ years</option>
              <option value="5">5+ years</option>
              <option value="10">10+ years</option>
              <option value="15">15+ years</option>
            </select>

            <select
              value={filters.sort}
              onChange={(event) =>
                handleFilterChange("sort", event.target.value)
              }
              className="h-13 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4 text-sm font-bold text-[#374151] outline-none transition focus:border-[#9381FF] focus:ring-4 focus:ring-[#9381FF]/10"
            >
              <option value="latest">Latest</option>
              <option value="experience_desc">Most Experienced</option>
              <option value="rating_desc">Top Rated</option>
              <option value="fee_asc">Lowest Fee</option>
            </select>
          </div>
        </section>

        <section className="mt-8">
          {isLoadingDoctors ? (
            <div className="rounded-3xl bg-[#F8FAFC] p-10 text-center text-sm font-bold text-[#6B7280]">
              Loading doctors...
            </div>
          ) : doctors.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-12 text-center">
              <h2 className="text-xl font-extrabold text-[#111827]">
                No doctors found
              </h2>

              <p className="mt-2 text-sm text-[#6B7280]">
                Try changing the search or filter options.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doctor) => (
                <DoctorListCard
                  key={doctor._id}
                  doctor={doctor}
                 onViewDetails={() => {
  const query = couponFromBanner
    ? `?coupon=${encodeURIComponent(couponFromBanner)}`
    : "";

  navigate(`/doctors/${doctor._id}${query}`);
}}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </PatientLayout>
  );
}

function DoctorListCard({ doctor, onViewDetails }) {
  const fullName = doctor.fullName || "Doctor";
  const profileImage = doctor.professionalInfo?.profileImage;
  const specialty =
    doctor.specialization?.displayName ||
    doctor.specialization?.name ||
    "Dental Specialist";

  return (
    <article className="group rounded-3xl border border-[#EEF0F6] bg-white p-6 shadow-[0_14px_38px_rgba(17,24,39,0.045)] transition hover:-translate-y-1 hover:border-[#B8B8FF] hover:shadow-[0_22px_52px_rgba(147,129,255,0.16)]">
      <div className="flex items-start gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-3xl bg-[#F0F1FF]">
          {profileImage ? (
            <img
              src={profileImage}
              alt={fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-[#9381FF]">
              {fullName.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-extrabold tracking-[-0.4px] text-[#111827]">
            Dr. {fullName.replace(/^Dr\.\s*/i, "")}
          </h3>

          <p className="mt-1 flex items-center gap-1 text-sm font-bold text-[#9381FF]">
            <Stethoscope size={15} />
            {specialty}
          </p>

          <div className="mt-3 flex items-center gap-1 text-sm font-bold text-[#111827]">
            <Star
              size={15}
              fill="currentColor"
              className="text-[#F59E0B]"
            />
            {doctor.stats?.averageRating || 0}
            <span className="font-medium text-[#9CA3AF]">
              ({doctor.stats?.totalReviews || 0} reviews)
            </span>
          </div>
        </div>
      </div>

      <p className="mt-5 line-clamp-3 text-sm leading-6 text-[#6B7280]">
        {getSpecialtyDescription(specialty)}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoBox
          icon={BriefcaseBusiness}
          label="Experience"
          value={`${doctor.professionalInfo?.experience || 0} years`}
        />

        <InfoBox
          icon={IndianRupee}
          label="Fee"
          value={`₹${doctor.professionalInfo?.consultationFee || 0}`}
        />
      </div>

      <button
        type="button"
        onClick={onViewDetails}
        className="mt-6 h-12 w-full rounded-2xl bg-[#9381FF] text-sm font-extrabold text-white shadow-[0_14px_28px_rgba(147,129,255,0.24)] transition hover:bg-[#7E6EF2]"
      >
        View Details
      </button>
    </article>
  );
}

function InfoBox({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1FF] text-[#9381FF]">
        <Icon size={17} />
      </div>

      <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#9CA3AF]">
        {label}
      </p>

      <p className="mt-1 text-sm font-extrabold text-[#111827]">
        {value}
      </p>
    </div>
  );
}

function getSpecialtyDescription(specialty) {
  const value = specialty.toLowerCase();

  if (value.includes("orthodont")) {
    return "Specializes in braces, aligners, bite correction, and improving teeth alignment for a healthier smile.";
  }

  if (value.includes("periodont")) {
    return "Focuses on gum health, gum disease treatment, dental implants, and long-term oral support care.";
  }

  if (value.includes("endodont")) {
    return "Expert in root canal therapy, tooth pain diagnosis, and saving infected or damaged teeth.";
  }

  if (value.includes("surgeon") || value.includes("surgery")) {
    return "Handles surgical dental procedures, wisdom tooth removal, extractions, and advanced oral treatments.";
  }

  return "Provides complete dental consultation, diagnosis, preventive care, and personalized treatment planning.";
}

export default FindDoctorsPage;