import Logo from "../common/Logo";

function AuthLayout({ children }) {
  return (
    <div
      className="
        relative
        flex
        min-h-screen
        items-center
        justify-center
        overflow-hidden
        bg-[#F8FAFC]
        px-6
        py-16
      "
    >
      {/* Background Blur */}
      <div
        className="
          absolute
          -left-24
          -top-24
          h-96
          w-96
          rounded-full
          bg-[rgba(158,171,254,0.1)]
          blur-3xl
        "
      />

      {/* Logo */}
      <div className="absolute left-8 top-8">
        <Logo />
      </div>

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-[448px]">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;