import Logo from "../common/Logo";
import { Link } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F8FAFC] px-6 py-10">
      {/* Background Blur */}
      <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[rgba(158,171,254,0.1)] blur-3xl" />

      {/* Logo */}
      <Link to={ROUTES.HOME||"/"}>
           <div className="relative z-20 mb-10">
        <Logo />
      </div>

      </Link>
    
      {/* Auth Card */}
      <div className="relative z-10 mx-auto flex w-full justify-center pb-10">
        {children}
      </div>
    </div>
  );
}

export default AuthLayout;