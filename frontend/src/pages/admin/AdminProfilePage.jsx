import DashboardLayout from "../../components/layout/DashboardLayout";

function AdminProfilePage() {
  return (
    <DashboardLayout title="Admin Profile">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-[rgba(172,178,189,0.1)] bg-white p-8 shadow-[0_12px_40px_rgba(76,89,166,0.08)]">
          <h2 className="font-manrope text-xl font-extrabold text-[#2D333B]">
            Admin Account
          </h2>

          <p className="mt-2 text-sm text-[#595F69]">
            Admin profile overview will be expanded later.
          </p>
        </div>

        <div className="rounded-3xl border border-[rgba(172,178,189,0.1)] bg-white p-8 shadow-[0_12px_40px_rgba(76,89,166,0.08)]">
          <h2 className="font-manrope text-xl font-extrabold text-[#2D333B]">
            Specialty Management
          </h2>

          <p className="mt-2 text-sm text-[#595F69]">
            Specialty create, edit, and status change UI will be built in admin phase.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminProfilePage;