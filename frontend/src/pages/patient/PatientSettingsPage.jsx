import DashboardLayout from "../../components/layout/DashboardLayout";

function PatientSettingsPage() {
  return (
    <DashboardLayout title="Patient Settings">
      <div className="rounded-3xl border border-[rgba(172,178,189,0.1)] bg-white p-8 shadow-[0_12px_40px_rgba(76,89,166,0.08)]">
        <h2 className="font-manrope text-xl font-extrabold text-[#2D333B]">
          Patient Account Settings
        </h2>

        <p className="mt-2 text-sm text-[#595F69]">
          Profile update, theme change, password change, and delete account UI will be built in the settings phase.
        </p>
      </div>
    </DashboardLayout>
  );
}

export default PatientSettingsPage;