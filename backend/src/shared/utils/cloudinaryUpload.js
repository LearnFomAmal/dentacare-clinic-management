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
        overwrite: true,
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
        if (error) {
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