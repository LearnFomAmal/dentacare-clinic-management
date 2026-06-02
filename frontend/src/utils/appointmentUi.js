export const formatAppointmentDate = (dateString) => {
  if (!dateString) return "Not available";

  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  });
};

export const formatAppointmentTime = (time) => {
  if (!time) return "";

  const [hourValue, minute] = time.split(":").map(Number);
  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(
    2,
    "0"
  )} ${period}`;
};

export const getDoctorName = (appointment) => {
  const doctor = appointment?.doctorId;

  if (!doctor || typeof doctor !== "object") return "Doctor";

  return [doctor.firstName, doctor.lastName].filter(Boolean).join(" ");
};

export const getPatientName = (appointment) => {
  const patient = appointment?.patientId;

  if (!patient || typeof patient !== "object") return "Patient";

  return patient.username || patient.email || "Patient";
};

export const getSpecialtyName = (appointment) => {
  const doctor = appointment?.doctorId;

  return (
    doctor?.specialization?.displayName ||
    doctor?.specialization?.name ||
    "Dental Specialist"
  );
};

export const getStatusBadgeClass = (status) => {
  if (status === "approved") {
    return "bg-green-50 text-green-700 border-green-100";
  }

  if (status === "pending") {
    return "bg-yellow-50 text-yellow-700 border-yellow-100";
  }

  if (status === "rejected") {
    return "bg-red-50 text-red-700 border-red-100";
  }

  if (status === "cancelled") {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  if (status === "pending_payment") {
    return "bg-orange-50 text-orange-700 border-orange-100";
  }

  if (status === "completed") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  return "bg-slate-50 text-slate-700 border-slate-100";
};

export const getCleanStatus = (status = "") => {
  return String(status || "")
    .replace("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const generateTransactionId = () => {
  return `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};