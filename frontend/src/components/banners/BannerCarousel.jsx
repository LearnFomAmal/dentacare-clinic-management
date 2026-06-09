import { useNavigate } from "react-router-dom";

import BannerCard from "./BannerCard";

function BannerCarousel({
  banners = [],
  title = "Offers for you",
  description = "Explore referral rewards and specialty-based coupon offers.",
  compact = false,
}) {
  const navigate = useNavigate();

  if (!banners.length) {
    return null;
  }

  const handleBannerClick = (banner) => {
    if (banner.redirectUrl) {
      navigate(banner.redirectUrl);
      return;
    }

    if (banner.type === "referral") {
      navigate("/referral");
      return;
    }

    if (banner.type === "specialty_coupon") {
      const specialtyId = banner.specialty?._id || banner.specialtyId || "";
      const couponCode = banner.couponCode || "";

      navigate(`/doctors?specialty=${specialtyId}&coupon=${couponCode}`);
    }
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
              key={banner._id}
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