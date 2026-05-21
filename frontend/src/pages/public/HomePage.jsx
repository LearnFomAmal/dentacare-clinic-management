import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logoutUser } from "../../features/auth/authSlice";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  ShieldCheck,
  ShieldPlus,
  SmilePlus,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";

import { ROUTES } from "../../constants/routes";

const doctors = [
  {
    name: "Dr. Sarah Jenkins",
    specialty: "Orthodontist",
    rating: "5.0",
    experience: "12 Years Exp.",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Dr. Michael Brown",
    specialty: "Periodontist",
    rating: "4.8",
    experience: "9 Years Exp.",
    image:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Dr. Aisha Khan",
    specialty: "Endodontist",
    rating: "4.9",
    experience: "15 Years Exp.",
    image:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=400&auto=format&fit=crop",
  },
  {
    name: "Dr. David Chen",
    specialty: "Oral Surgeon",
    rating: "4.7",
    experience: "7 Years Exp.",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=400&auto=format&fit=crop",
  },
];

const services = [
  {
    title: "Easy Appointment Booking",
    description:
      "Book your dental appointments online with just a few clicks. View available time slots and choose what works best for you.",
    icon: CalendarDays,
  },
  {
    title: "Find Expert Dentists",
    description:
      "Browse through our network of qualified dentists. Filter by specialization, experience, and availability.",
    icon: UsersRound,
  },
  {
    title: "Medical Records",
    description:
      "Access your dental records anytime. Upload X-rays, prescriptions, and track your treatment history securely.",
    icon: FileText,
  },
  {
    title: "Multiple Specializations",
    description:
      "From general dentistry to orthodontics, oral surgery, and cosmetic procedures - we have specialists for every need.",
    icon: SmilePlus,
  },
  {
    title: "Secure & Private",
    description:
      "Your medical information is protected with enterprise-grade security and careful data handling.",
    icon: ShieldCheck,
  },
  {
    title: "Personalized Care",
    description:
      "Customize your preferences, set reminders, and receive personalized dental care recommendations.",
    icon: Sparkles,
  },
];

const reviews = [
  {
    name: "Sarah Jenkins",
    tag: "Routine Hygiene",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    text: "The most painless experience I've ever had at a dentist. The staff is incredibly professional and caring.",
  },
  {
    name: "David Thomuson",
    tag: "Dental Implants",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    text: "I was nervous about the procedure, but the team explained everything so clearly. My smile has never looked better!",
  },
  {
    name: "Elena Rodriguez",
    tag: "Teeth Whitening",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
    text: "Fast, efficient, and great results. The whitening treatment exceeded my expectations in just one visit.",
  },
];

const transformationImages = [
  "https://i.pinimg.com/736x/d8/6e/48/d86e48ca22e502cee1dacb6b2a9dcc15.jpg",
  "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?q=80&w=500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1588776814546-daab30f310ce?q=80&w=500&auto=format&fit=crop",
];

function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <HomeNavbar />

      <main>
        <HeroSection />
        <DoctorsSection />
        <ServicesSection />
        <TransformationSection />
        <ReviewsSection />
      </main>

      <Footer />
    </div>
  );
}

function HomeNavbar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { isAuthenticated, role, user } = useAppSelector(
    (state) => state.auth
  );

  const isPatient = isAuthenticated && role === "patient";

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser(role)).unwrap();
      toast.success("Logged out successfully");
      navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      toast.success("Logged out successfully");
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#F1F2F8] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[78px] max-w-[1237px] items-center justify-between px-8 lg:px-12">
        <Link to={ROUTES.HOME} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9381FF] text-white shadow-[0_8px_20px_rgba(147,129,255,0.25)]">
            <ShieldPlus size={21} />
          </div>

          <span className="text-2xl font-extrabold tracking-[-0.6px] text-[#111827]">
            DentaCare
          </span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          <Link
            to={ROUTES.HOME}
            className="text-[15px] font-semibold text-[#2D333B] transition hover:text-[#7E87E1]"
          >
            Home
          </Link>

          {isPatient && (
            <>
              <Link
                to={ROUTES.USER_SETTINGS}
                className="text-[15px] font-semibold text-[#2D333B] transition hover:text-[#7E87E1]"
              >
                Dashboard
              </Link>

              <Link
                to={ROUTES.FIND_DOCTORS}
                className="text-[15px] font-semibold text-[#2D333B] transition hover:text-[#7E87E1]"
              >
                Find Doctors
              </Link>
            </>
          )}

          {!isPatient && (
            <>
              <a
                href="#services"
                className="text-[15px] font-semibold text-[#2D333B] transition hover:text-[#7E87E1]"
              >
                Services
              </a>

              <a
                href="#doctors"
                className="text-[15px] font-semibold text-[#2D333B] transition hover:text-[#7E87E1]"
              >
                Find Doctors
              </a>
            </>
          )}
        </nav>

        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-10 w-10 overflow-hidden rounded-full bg-[#F0F1FF]">
                {user?.personalInfo?.profileImage || user?.profileImage ? (
                  <img
                    src={user?.personalInfo?.profileImage || user?.profileImage}
                    alt={user?.username || user?.email || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#9381FF]">
                    {(user?.username || user?.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-[#111827]">
                  {user?.username ||
                    [user?.firstName, user?.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    "User"}
                </p>

                <p className="text-xs capitalize text-[#6B7280]">
                  {role}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border-2 border-[#7E87E1] bg-white px-5 py-2.5 text-[15px] font-semibold leading-none text-[#7E87E1] transition hover:bg-[#F0F1FF]"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to={ROUTES.REGISTER}
              className="rounded-lg border-2 border-[#7E87E1] bg-white px-7 py-2.5 text-[15px] font-semibold leading-none text-[#7E87E1] shadow-[0_2px_4px_rgba(123,97,255,0.08)] transition hover:bg-[#F0F1FF]"
            >
              Register
            </Link>

            <Link
              to={ROUTES.LOGIN}
              className="rounded-lg bg-[#7E87E1] px-8 py-3 text-[15px] font-bold leading-none text-white shadow-[0_8px_18px_rgba(126,135,225,0.28)] transition hover:bg-[#6f78db]"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-b from-[#B8B8FF] via-[#ECECFF] to-white"
    >
      {/* Background glow layers */}
      <div className="pointer-events-none absolute left-1/2 top-14 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-white/35 blur-[90px]" />
      <div className="pointer-events-none absolute left-[8%] top-24 h-72 w-72 rounded-full bg-[#9381FF]/20 blur-[80px]" />
      <div className="pointer-events-none absolute right-[8%] top-28 h-80 w-80 rounded-full bg-white/50 blur-[90px]" />

      <div className="relative z-10 mx-auto flex min-h-[760px] max-w-[1237px] flex-col items-center px-6 pt-12">
        {/* Floating Hero Image */}
        <div className="group relative flex w-full justify-center">
          {/* soft floor shadow */}
          <div className="absolute bottom-[-18px] h-20 w-[610px] rounded-full bg-[#4C59A6]/25 blur-[45px] transition-all duration-500 group-hover:w-[660px] group-hover:bg-[#4C59A6]/30" />

          {/* subtle image glow */}
          <div className="absolute top-8 h-[410px] w-[650px] rounded-[42px] bg-white/25 blur-2xl" />

          <img
            src="https://i.pinimg.com/736x/50/5b/a7/505ba7785db5ebb8200cc8a978dbcd55.jpg"
            alt="Smiling dental patient"
            className="relative z-10 h-[430px] w-[660px] rounded-[42px] object-cover object-center shadow-[0_38px_100px_rgba(76,89,166,0.32)] ring-1 ring-white/50 transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.025] group-hover:shadow-[0_48px_120px_rgba(76,89,166,0.42)]"
          />
        </div>

        {/* Hero Text */}
        <div className="relative z-20 mt-12 flex max-w-[960px] flex-col items-center gap-6 text-center">
          <h1 className="flex flex-wrap items-center justify-center gap-5 text-[72px] font-extrabold leading-none tracking-[-1.8px] text-[#111827]">
            <span className="rounded-2xl bg-[#7E87E1] px-5 py-3 text-white shadow-[0_18px_38px_rgba(126,135,225,0.28)]">
              Your Smile
            </span>

            <span>Our Pride</span>
          </h1>

          <p className="max-w-[720px] text-xl leading-8 text-[#4B5563]">
            Experience exceptional dental care with our expert team. Your
            journey to a perfect smile starts here.
          </p>
        </div>
      </div>
    </section>
  );
}

function DoctorsSection() {
  return (
    <section id="doctors" className="bg-white px-6 py-16">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Our Doctors</h2>

          <Link
            to={ROUTES.LOGIN}
            className="text-[15px] font-semibold text-[#9381FF]"
          >
            See All
          </Link>
        </div>

        <div className="flex items-center gap-5">
          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#F1F5F9] text-[#9381FF]">
            <ChevronLeft size={24} />
          </button>

          <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.name} doctor={doctor} />
            ))}
          </div>

          <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 bg-[#F1F5F9] text-[#9381FF]">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}

function DoctorCard({ doctor }) {
  return (
    <div className="flex h-[300px] flex-col items-center rounded-lg border border-black/10 bg-white px-5 py-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
      <img
        src={doctor.image}
        alt={doctor.name}
        className="mb-4 h-24 w-24 rounded-full border-[3px] border-[#F8FAFC] object-cover"
      />

      <h3 className="mb-1 text-center text-base font-bold text-black">
        {doctor.name}
      </h3>

      <p className="mb-4 text-center text-sm font-medium text-[#7A7A85]">
        {doctor.specialty}
      </p>

      <div className="mb-6 flex items-center gap-1.5 text-sm">
        <Star size={16} className="text-[#FFC107]" />
        <span className="font-medium text-black">{doctor.rating}</span>
        <span className="text-[#7A7A85]">• {doctor.experience}</span>
      </div>

      <Link
        to={ROUTES.LOGIN}
        className="mt-auto flex h-10 w-full items-center justify-center rounded-md bg-[#9381FF] text-sm font-semibold text-white transition hover:bg-[#7E87E1]"
      >
        Book Appointment
      </Link>
    </div>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="bg-white px-12 py-24">
      <div className="mx-auto max-w-[1141px]">
        <div className="mb-20 flex flex-col items-center gap-4 text-center">
          <span className="rounded-full bg-[#F0F1FF] px-4 py-1 text-sm font-bold text-[#7E87E1]">
            Our Services
          </span>

          <h2 className="text-5xl font-bold leading-none text-[#111827]">
            Everything You Need for Dental Care
          </h2>

          <p className="max-w-[672px] pt-2 text-lg leading-[29px] text-[#6B7280]">
            Our comprehensive platform provides all the tools you need to manage
            your dental health effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.title} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceCard({ service }) {
  const Icon = service.icon;

  return (
    <div className="rounded-3xl border border-[#F3F4F6] bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0F1FF] text-[#7E87E1]">
        <Icon size={32} strokeWidth={2} />
      </div>

      <h3 className="mb-4 text-2xl font-bold leading-8 text-[#111827]">
        {service.title}
      </h3>

      <p className="text-base leading-[26px] text-[#6B7280]">
        {service.description}
      </p>
    </div>
  );
}

function TransformationSection() {
  return (
    <section className="bg-white px-6 py-32">
      <div className="mx-auto max-w-[1272px] text-center">
        <h2 className="font-manrope text-[60px] font-extrabold leading-none tracking-[-3px] text-[#2D333B]">
          Transform Your{" "}
          <span className="text-[#9381FF]">Smile</span>
        </h2>

        <p className="mx-auto mt-4 max-w-[672px] text-lg leading-[29px] text-[#595F69]">
          See real results from our dental treatments. Our bespoke care combines
          clinical precision with artistic restoration.
        </p>

        <div className="mt-24 grid grid-cols-1 items-center gap-10 md:grid-cols-3">
          {transformationImages.map((image, index) => (
            <img
              key={image}
              src={image}
              alt={`Smile transformation ${index + 1}`}
              className={`mx-auto object-cover shadow-sm ${
                index === 0
                  ? "h-[374px] w-[299px]"
                  : index === 1
                    ? "h-[354px] w-[354px]"
                    : "h-[350px] w-[350px]"
              }`}
            />
          ))}
        </div>

        <div className="mt-12 flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-[rgba(172,178,189,0.3)]" />
          <p className="text-base font-medium text-[#595F69]">
            Ready for your own transformation?
          </p>
          <div className="h-px w-12 bg-[rgba(172,178,189,0.3)]" />
        </div>

        <div className="mt-7 flex items-center justify-center gap-6">
          <div className="flex -space-x-3">
            {reviews.map((review) => (
              <img
                key={review.name}
                src={review.image}
                alt={review.name}
                className="h-10 w-10 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>

          <p className="text-sm font-medium text-[#595F69]">
            Join 2,400+ happy patients
          </p>
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  return (
    <section className="bg-white px-8 py-24">
      <div className="mx-auto max-w-[1216px]">
        <div className="mb-20 flex flex-col items-center gap-4 text-center">
          <h2 className="font-manrope text-5xl font-extrabold leading-none tracking-[-1.2px] text-black">
            Patient Reviews
          </h2>

          <p className="text-lg leading-7 text-[#595F69]">
            What our patients say about us
          </p>

          <div className="h-1.5 w-20 rounded-full bg-[#9381FF]" />
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard key={review.name} review={review} />
          ))}
        </div>

        <div className="mt-14 flex justify-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#9381FF]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#B8B8FF]/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#B8B8FF]/40" />
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-3xl bg-[linear-gradient(125.71deg,#B8B8FF_0%,#FFFFFF_100%)] p-8 shadow-[0_12px_40px_rgba(76,89,166,0.08)]">
      <div className="mb-6 flex items-center gap-4">
        <img
          src={review.image}
          alt={review.name}
          className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm"
        />

        <div>
          <h3 className="font-manrope text-lg font-bold text-black">
            {review.name}
          </h3>

          <div className="mt-1 flex gap-0.5 text-[#FFD700]">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} size={13} fill="currentColor" />
            ))}
          </div>
        </div>
      </div>

      <p className="mb-6 text-base italic leading-[26px] text-[#2D333B]">
        "{review.text}"
      </p>

      <span className="inline-flex rounded-full border border-white/80 bg-white/50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.6px] text-[#9381FF]">
        {review.tag}
      </span>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#F3F4F6] bg-white px-12 pb-12 pt-24">
      <div className="mx-auto max-w-[1136px]">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7E87E1] text-lg font-bold text-white">
                DC
              </div>

              <span className="text-2xl font-bold tracking-[-0.6px] text-[#111827]">
                DentaCare
              </span>
            </div>

            <p className="max-w-[248px] text-base leading-[26px] text-[#6B7280]">
              Your trusted partner in dental health management. Book
              appointments, find dentists, and manage your records.
            </p>
          </div>

          <FooterColumn
            title="Quick Links"
            links={["Home", "Services", "About Us", "Contact"]}
          />

          <FooterColumn
            title="For Patients"
            links={["Register", "Login", "Dashboard", "Find Dentists"]}
          />

          <FooterColumn
            title="Support"
            links={["Help Center", "Privacy Policy", "Terms of Service", "FAQ"]}
          />
        </div>

        <div className="mt-20 border-t border-[#F3F4F6] pt-8 text-center text-sm text-[#9CA3AF]">
          © 2026 DentaCare. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }) {
  return (
    <div>
      <h4 className="mb-6 text-lg font-bold leading-7 text-[#111827]">
        {title}
      </h4>

      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link}>
            <a href="#home" className="text-base leading-6 text-[#6B7280]">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HomePage;