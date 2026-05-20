import multer from "multer";

import AppError from "../shared/errors/AppError.js";

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new AppError(
        "Only JPG, JPEG, PNG and WEBP images are allowed",
        400
      )
    );
  }

  cb(null, true);
};

export const uploadProfileImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
}).single("profileImage");