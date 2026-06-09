import { Gift, Megaphone, TicketPercent } from "lucide-react";

function BannerCard({ banner, onClick, compact = false }) {
  const isReferral = banner.type === "referral";
  const Icon = isReferral ? Gift : TicketPercent;

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

      <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/78 via-[#111827]/45 to-transparent" />

      <div className="relative z-10 flex h-full max-w-[70%] flex-col justify-between p-6">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.8px] text-[#9381FF]">
            <Icon size={15} />
            {isReferral ? "Referral Reward" : "Specialty Offer"}
          </div>

          <h3 className="line-clamp-2 text-2xl font-extrabold tracking-[-0.6px] text-white">
            {banner.title}
          </h3>

          {banner.description && (
            <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-white/85">
              {banner.description}
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