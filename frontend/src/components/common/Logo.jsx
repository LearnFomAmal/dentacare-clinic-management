import { ShieldPlus } from "lucide-react";

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-[#4C59A6]
          text-white
        "
      >
        <ShieldPlus size={20} />
      </div>

      <div>
        <h2
          className="
            font-manrope
            text-lg
            font-extrabold
            text-[#4C59A6]
          "
        >
          DentaCare
        </h2>

        <p
          className="
            text-[10px]
            uppercase
            tracking-[1px]
            text-slate-500
          "
        >
          Dental Clinic Appointment System
        </p>
      </div>
    </div>
  );
}

export default Logo;