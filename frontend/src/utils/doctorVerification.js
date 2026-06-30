import { ROUTES } from "../constants/routes";

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export const isDoctorProfessionallyVerified = (user) => {
  if (!user) return false;

  const verificationStatus = normalizeStatus(
    user?.verification?.status ||
      user?.accountStatus?.verificationStatus ||
      user?.verificationStatus ||
      user?.professionalVerificationStatus
  );

  const explicitlyNotApprovedStatuses = [
    "pending",
    "submitted",
    "under_review",
    "rejected",
    "not_submitted",
    "not-submitted",
  ];

  if (explicitlyNotApprovedStatuses.includes(verificationStatus)) {
    return false;
  }

  if (verificationStatus === "approved") {
    return true;
  }

  if (user?.accountStatus?.isVerified === true) {
    return true;
  }

  return Boolean(
    user?.verification?.emailVerified === true &&
      (user?.verification?.professionalVerified === true ||
        user?.verification?.isProfessionalVerified === true)
  );
};

export const DOCTOR_VERIFICATION_ALLOWED_ROUTES = [
  ROUTES.DOCTOR_VERIFICATION_STATUS,
  ROUTES.DOCTOR_UPLOAD_DOCUMENTS,
  ROUTES.DOCTOR_SETTINGS,
];

export const DOCTOR_VERIFICATION_PAGES = [
  ROUTES.DOCTOR_VERIFICATION_STATUS,
  ROUTES.DOCTOR_UPLOAD_DOCUMENTS,
];