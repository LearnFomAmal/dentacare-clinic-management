import AuthLayout from "../components/layout/AuthLayout";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

function AppRoutes() {
  return (
    <AuthLayout>
      <Card>
        <div className="space-y-8">
          <div className="space-y-2 text-center">
            <h1
              className="
                font-manrope
                text-3xl
                font-extrabold
                text-[#2D333B]
              "
            >
              Welcome Back
            </h1>

            <p className="text-sm text-[#595F69]">
              Login to continue your account
            </p>
          </div>

          <div className="space-y-6">
            <Input
              label="Email ID"
              placeholder="name@example.com"
              name="email"
              register={() => ({})}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              name="password"
              register={() => ({})}
            />

            <Button>
              Login
            </Button>
          </div>
        </div>
      </Card>
    </AuthLayout>
  );
}

export default AppRoutes;