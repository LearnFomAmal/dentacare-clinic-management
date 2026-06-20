import { useNavigate } from "react-router-dom";

import BannerCard from "./BannerCard";
import { ROUTES } from "../../constants/routes";

const normalizeText = (value) => {
  return String(value || "").trim().toLowerCase();
};

const getBannerType = (banner) => {
  return normalizeText(
    banner?.type ||
      banner?.bannerType ||
      banner?.redirectType ||
      banner?.category
  );
};

const getSpecialtyId = (banner) => {
  return (
    banner?.specialty?._id ||
    banner?.specialtyId?._id ||
    banner?.specialtyId ||
    banner?.redirectId?._id ||
    banner?.redirectId ||
    ""
  );
};

const getCouponCode = (banner) => {
  return (
    banner?.couponCode ||
    banner?.coupon?.code ||
    banner?.couponId?.code ||
    banner?.couponId ||
    ""
  );
};

const isExternalUrl = (url) => {
  return /^https?:\/\//i.test(String(url || "").trim());
};

const isValidInternalUrl = (url) => {
  const cleanUrl = String(url || "").trim();

  if (!cleanUrl) return false;
  if (cleanUrl === "/") return false;
  if (cleanUrl === "#") return false;

  return cleanUrl.startsWith("/");
};

function BannerCarousel({
  banners = [],
  title = "Offers for you",
  description = "Explore referral rewards and specialty-based coupon offers.",
  compact = false,
}) {
  const navigate = useNavigate();

  if (!Array.isArray(banners) || banners.length === 0) {
    return null;
  }

  const handleBannerClick = (banner) => {
    const bannerType = getBannerType(banner);

    // ✅ Referral banner
    if (
      bannerType === "referral" ||
      bannerType === "referral_ad" ||
      bannerType === "referral_banner"
    ) {
      navigate(ROUTES.REFERRALS);
      return;
    }

    // ✅ Specialty / coupon banner
    // This must run BEFORE redirectUrl, because some banners may contain redirectUrl: "/"
    if (
      bannerType === "specialty" ||
      bannerType === "specialty_coupon" ||
      bannerType === "coupon" ||
      bannerType === "offer"
    ) {
      const specialtyId = getSpecialtyId(banner);
      const couponCode = getCouponCode(banner);

      const params = new URLSearchParams();

      if (specialtyId) {
        params.set("specialty", specialtyId);
      }

      if (couponCode) {
        params.set("coupon", couponCode);
      }

      navigate({
        pathname: ROUTES.FIND_DOCTORS,
        search: params.toString() ? `?${params.toString()}` : "",
      });

      return;
    }

    // ✅ Custom redirect URL only if it is useful
    if (banner?.redirectUrl) {
      const redirectUrl = String(banner.redirectUrl).trim();

      if (isExternalUrl(redirectUrl)) {
        window.location.href = redirectUrl;
        return;
      }

      if (isValidInternalUrl(redirectUrl)) {
        navigate(redirectUrl);
        return;
      }
    }

    // ✅ Safe fallback
    navigate(ROUTES.FIND_DOCTORS);
  };

  return (
    <section className={compact ? "mb-8" : "bg-white px-6 py-10"}>
      <div className={compact ? "" : "mx-auto max-w-[1237px]"}>
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[1px] text-[#9381FF]">
              {title}
            </p>

            {description && (
              <p className="mt-1 max-w-[620px] text-sm leading-6 text-[#6B7280]">
                {description}
              </p>
            )}
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.8px] text-[#9CA3AF]">
            Scroll sideways
          </p>
        </div>

        <div className="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
          {banners.map((banner) => (
            <BannerCard
              key={banner._id || banner.id}
              banner={banner}
              compact={compact}
              onClick={handleBannerClick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default BannerCarousel;