import cloudinary from "../../config/cloudinary.js";
import AppError from "../errors/AppError.js";

export const uploadBufferToCloudinary = ({
  buffer,
  folder,
  publicId,
}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",

        // Important when replacing the same profile image again
        overwrite: true,
        invalidate: true,
        unique_filename: false,

        transformation: [
          {
            width: 500,
            height: 500,
            crop: "fill",
            gravity: "face",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(
            new AppError(
              "Failed to upload image. Please try again.",
              500
            )
          );
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

export const uploadFileBufferToCloudinary = ({
  buffer,
  folder,
  publicId,
  resourceType = "auto",
}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
        invalidate: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(
            new AppError(
              "Failed to upload file. Please try again.",
              500
            )
          );
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};