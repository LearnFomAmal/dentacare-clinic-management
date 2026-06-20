export const formatAppointmentDate = (dateString) => {
  if (!dateString) return "Not available";

  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "short",
  });
};

export const formatAppointmentTime = (time) => {
  if (!time) return "";

  const [hourValue, minuteValue] = String(time).split(":").map(Number);

  if (
    Number.isNaN(hourValue) ||
    Number.isNaN(minuteValue)
  ) {
    return "";
  }

  const period = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;

  return `${String(hour).padStart(2, "0")}:${String(minuteValue).padStart(
    2,
    "0"
  )} ${period}`;
};

export const getDoctorName = (appointment) => {
  const doctor = appointment?.doctorId;

  if (!doctor || typeof doctor !== "object") return "Doctor";

  const fullName = [doctor.firstName, doctor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Doctor";
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

  if (status === "expired") {
    return "bg-zinc-100 text-zinc-700 border-zinc-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-100";
};

export const getCleanStatus = (status = "") => {
  return String(status || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const generateTransactionId = () => {
  return `TXN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

/**
 * Builds appointment date-time using India timezone.
 * Your app stores appointmentDate as YYYY-MM-DD and time as HH:mm.
 */
export const buildAppointmentDateTime = ({ appointmentDate, time }) => {
  if (!appointmentDate || !time) return null;

  const date = new Date(`${appointmentDate}T${time}:00+05:30`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

export const buildAppointmentEndDateTime = (appointment) => {
  return buildAppointmentDateTime({
    appointmentDate: appointment?.appointmentDate,
    time: appointment?.endTime,
  });
};

export const buildAppointmentStartDateTime = (appointment) => {
  return buildAppointmentDateTime({
    appointmentDate: appointment?.appointmentDate,
    time: appointment?.startTime,
  });
};

export const isAppointmentEndTimePast = (appointment) => {
  const appointmentEnd = buildAppointmentEndDateTime(appointment);

  if (!appointmentEnd) return false;

  return appointmentEnd <= new Date();
};

export const isAppointmentStartTimePast = (appointment) => {
  const appointmentStart = buildAppointmentStartDateTime(appointment);

  if (!appointmentStart) return false;

  return appointmentStart <= new Date();
};

export const canCancelAppointment = (appointment) => {
  if (!appointment) return false;

  if (!["pending", "approved"].includes(appointment.status)) {
    return false;
  }

  return !isAppointmentStartTimePast(appointment);
};

export const canRescheduleAppointment = (appointment) => {
  if (!appointment) return false;

  if (!["pending", "approved"].includes(appointment.status)) {
    return false;
  }

  return !isAppointmentStartTimePast(appointment);
};

export const canDecideAppointment = (appointment) => {
  if (!appointment) return false;

  return (
    appointment.status === "pending" &&
    appointment.paymentStatus === "paid" &&
    !isAppointmentStartTimePast(appointment)
  );
};

export const CANCELLATION_REFUND_CUTOFF_HOURS = 4;

export const getCancellationRefundInfo = (appointment) => {
  if (!appointment) {
    return {
      isPaid: false,
      refundEligible: false,
      isLateCancellation: false,
      message: "",
    };
  }

  if (appointment.paymentStatus !== "paid") {
    return {
      isPaid: false,
      refundEligible: false,
      isLateCancellation: false,
      message: "No paid payment found for refund.",
    };
  }

  const appointmentStart = buildAppointmentStartDateTime(appointment);

  if (!appointmentStart) {
    return {
      isPaid: true,
      refundEligible: false,
      isLateCancellation: false,
      message: "Refund status cannot be calculated.",
    };
  }

  const now = new Date();

  const refundCutoffTime = new Date(
    appointmentStart.getTime() -
      CANCELLATION_REFUND_CUTOFF_HOURS * 60 * 60 * 1000
  );

  const refundEligible = now <= refundCutoffTime;

  return {
    isPaid: true,
    refundEligible,
    isLateCancellation: !refundEligible,
    cutoffTime: refundCutoffTime,
    message: refundEligible
      ? `You are cancelling at least ${CANCELLATION_REFUND_CUTOFF_HOURS} hours before the appointment. Refund will be credited to your wallet.`
      : `You are cancelling within ${CANCELLATION_REFUND_CUTOFF_HOURS} hours of the appointment. The appointment will be cancelled, but refund will not be issued.`,
  };
};

/**
 * Doctor can complete only after the consultation end time.
 * Example: 4 PM - 5 PM appointment can be completed only after 5 PM.
 */
export const canCompleteAppointment = (appointment) => {
  if (!appointment) return false;

  return (
    appointment.status === "approved" &&
    appointment.paymentStatus === "paid" &&
    isAppointmentEndTimePast(appointment)
  );
};

/**
 * Option A logic:
 * Approved appointments should not auto-complete.
 * After end time, they should show as "Approved - Awaiting Completion".
 */
export const isApprovedAwaitingCompletion = (appointment) => {
  if (!appointment) return false;

  return (
    appointment.status === "approved" &&
    appointment.paymentStatus === "paid" &&
    isAppointmentEndTimePast(appointment)
  );
};

export const getAppointmentDisplayStatus = (appointment) => {
  if (isApprovedAwaitingCompletion(appointment)) {
    return "Approved - Awaiting Completion";
  }

  return getCleanStatus(appointment?.status);
};