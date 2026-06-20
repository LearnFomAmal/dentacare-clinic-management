import { Gift, Megaphone, TicketPercent } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getBannerValidityText = (banner) => {
  const coupon = banner?.coupon || banner?.couponId || null;

  const validFrom =
    coupon?.validFrom || banner?.couponValidFrom || banner?.startDate || "";

  const validTo =
    coupon?.validTo || banner?.couponValidTo || banner?.endDate || "";

  const fromText = formatDate(validFrom);
  const toText = formatDate(validTo);

  if (fromText && toText) {
    return `Valid ${fromText} - ${toText}`;
  }

  if (toText) {
    return `Valid till ${toText}`;
  }

  return "";
};

function BannerCard({ banner, onClick, compact = false }) {
  const isReferral = banner.type === "referral";
  const Icon = isReferral ? Gift : TicketPercent;
  const validityText = getBannerValidityText(banner);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(banner)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onClick?.(banner);
        }
      }}
      className={`group relative min-w-[320px] cursor-pointer overflow-hidden rounded-3xl border border-white/60 bg-[#F8FAFC] shadow-[0_18px_48px_rgba(17,24,39,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(147,129,255,0.24)] ${
        compact ? "h-[190px]" : "h-[240px] md:min-w-[560px]"
      }`}
    >
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/82 via-[#111827]/52 to-transparent" />

      <div className="relative z-10 flex h-full max-w-[74%] flex-col justify-between p-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.8px] text-[#9381FF]">
            <Icon size={15} />
            {isReferral ? "Referral Reward" : "Specialty Offer"}
          </div>

          <h3 className="line-clamp-2 text-2xl font-extrabold tracking-[-0.6px] text-white">
            {banner.title}
          </h3>

          {banner.description && (
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-white/90">
              {banner.description}
            </p>
          )}

          {!isReferral && validityText && (
            <p className="mt-2 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-white ring-1 ring-white/25">
              {validityText}
            </p>
          )}
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-[#111827] transition group-hover:bg-[#9381FF] group-hover:text-white">
          <Megaphone size={16} />
          {banner.ctaText || "View Offer"}
        </div>
      </div>
    </article>
  );
}

export default BannerCard;