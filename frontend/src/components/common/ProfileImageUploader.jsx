import { Camera, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import Button from "../ui/Button";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const getInitials = ({
  username = "",
  firstName = "",
  lastName = "",
  email = "",
}) => {
  const clean = (value) => String(value || "").trim();

  if (firstName || lastName) {
    const first = clean(firstName).charAt(0);
    const last = clean(lastName).charAt(0);

    if (first || last) {
      return `${first}${last}`.toUpperCase();
    }
  }

  if (username) {
    const parts = clean(username).split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }

    return clean(username).slice(0, 2).toUpperCase();
  }

  if (email) {
    return clean(email).slice(0, 2).toUpperCase();
  }

  return "DC";
};

function ProfileImageUploader({
  title = "Profile Picture",
  description = "Upload a clear profile picture.",
  user,
  imageUrl = "",
  onUpload,
  isUploading = false,
}) {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const initials = useMemo(
    () =>
      getInitials({
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      }),
    [user]
  );

  const displayImage = previewUrl || imageUrl;

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG and WEBP images are allowed");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size must be less than 2MB");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveSelected = () => {
    setSelectedFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please choose an image first");
      return;
    }

    await onUpload(selectedFile);

    setSelectedFile(null);
    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-[rgba(172,178,189,0.14)] bg-[#F8FAFC] p-6 dark:border-slate-800 dark:bg-slate-950 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-5">
        <div className="relative">
          {displayImage ? (
            <img
              src={displayImage}
              alt="Profile"
              className="h-24 w-24 rounded-3xl border-4 border-white object-cover shadow-[0_12px_30px_rgba(76,89,166,0.16)] dark:border-slate-800"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[#4C59A6] text-3xl font-extrabold text-white shadow-[0_12px_30px_rgba(76,89,166,0.18)]">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={handleChooseFile}
            className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#B8B8FF] text-[#2D333B] shadow-md transition hover:scale-105"
          >
            <Camera size={18} />
          </button>
        </div>

        <div>
          <h3 className="font-manrope text-lg font-extrabold text-[#2D333B] dark:text-slate-100">
            {title}
          </h3>

          <p className="mt-1 max-w-[360px] text-sm leading-6 text-[#595F69] dark:text-slate-400">
            {description}
          </p>

          {selectedFile && (
            <div className="mt-3 flex items-center gap-3">
              <span className="max-w-[220px] truncate text-xs font-semibold text-[#4C59A6] dark:text-[#B8B8FF]">
                {selectedFile.name}
              </span>

              <button
                type="button"
                onClick={handleRemoveSelected}
                className="flex items-center gap-1 text-xs font-bold text-red-500"
              >
                <X size={14} />
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={handleChooseFile}
          className="rounded-3xl border border-[rgba(172,178,189,0.25)] bg-white px-5 py-3 text-sm font-bold text-[#595F69] transition hover:border-[#4C59A6] hover:text-[#4C59A6] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-[#B8B8FF] dark:hover:text-[#B8B8FF]"
        >
          Choose Image
        </button>

        <Button
          type="button"
          fullWidth={false}
          loading={isUploading}
          disabled={!selectedFile}
          onClick={handleUpload}
          className="h-12 min-w-[150px]"
        >
          <span className="flex items-center justify-center gap-2">
            <Upload size={16} />
            Upload
          </span>
        </Button>
      </div>
    </div>
  );
}

export default ProfileImageUploader;