import multer from "multer";

import AppError from "../shared/errors/AppError.js";

const storage = multer.memoryStorage();

const profileImageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const reportMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const createFileFilter = (allowedMimeTypes, errorMessage) => {
  return (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new AppError(errorMessage, 400));
    }

    cb(null, true);
  };
};

export const uploadProfileImage = multer({
  storage,
  fileFilter: createFileFilter(
    profileImageMimeTypes,
    "Only JPG, JPEG, PNG and WEBP images are allowed"
  ),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
}).single("profileImage");

export const uploadBookingReport = multer({
  storage,
  fileFilter: createFileFilter(
    reportMimeTypes,
    "Only JPG, JPEG, PNG, WEBP and PDF files are allowed"
  ),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

export const uploadDoctorPrescription = multer({
  storage,
  fileFilter: createFileFilter(
    reportMimeTypes,
    "Only JPG, JPEG, PNG, WEBP and PDF files are allowed"
  ),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
}).single("file");

export const uploadBannerImage = multer({
  storage,
  fileFilter: createFileFilter(
    profileImageMimeTypes,
    "Only JPG, JPEG, PNG and WEBP banner images are allowed"
  ),
  limits: {
    fileSize: 3 * 1024 * 1024,
  },
}).single("bannerImage");