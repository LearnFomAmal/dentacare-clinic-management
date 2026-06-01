import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { RotateCcw, X } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../ui/Button";
import { getCroppedImageFile } from "../../utils/cropImage";

function ImageCropperModal({
  open,
  imageSrc,
  fileName = "cropped-image.jpg",
  aspect = 1,
  cropShape = "rect",
  title = "Crop Image",
  description = "Adjust the image before uploading.",
  onCancel,
  onCropComplete,
}) {
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  const handleCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSaveCrop = async () => {
    if (!croppedAreaPixels) {
      toast.error("Please select crop area");
      return;
    }

    try {
      setIsCropping(true);

      const croppedFile = await getCroppedImageFile({
        imageSrc,
        pixelCrop: croppedAreaPixels,
        rotation,
        fileName,
        mimeType: "image/jpeg",
      });

      onCropComplete(croppedFile);
    } catch (error) {
      toast.error(error?.message || "Failed to crop image");
    } finally {
      setIsCropping(false);
    }
  };

  const handleReset = () => {
    setCrop({
      x: 0,
      y: 0,
    });
    setZoom(1);
    setRotation(0);
  };

  if (!open || !imageSrc) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="w-full max-w-[720px] overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.28)] dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 border-b border-[#EEF0F6] px-6 py-5 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-extrabold text-[#111827] dark:text-white">
              {title}
            </h2>

            <p className="mt-1 text-sm text-[#6B7280] dark:text-slate-400">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F8FAFC] text-[#6B7280] transition hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative h-[420px] bg-slate-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-[0.7px] text-[#6B7280]">
                Zoom
              </label>

              <span className="text-xs font-bold text-[#9381FF]">
                {zoom.toFixed(1)}x
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-[#9381FF]"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-[0.7px] text-[#6B7280]">
                Rotation
              </label>

              <span className="text-xs font-bold text-[#9381FF]">
                {rotation}°
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(event) => setRotation(Number(event.target.value))}
              className="w-full accent-[#9381FF]"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#EEF0F6] px-5 text-sm font-extrabold text-[#6B7280] transition hover:border-[#9381FF] hover:text-[#9381FF] dark:border-slate-700 dark:text-slate-300"
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="h-11 rounded-2xl border border-[#EEF0F6] px-5 text-sm font-extrabold text-[#6B7280] transition hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>

              <Button
                type="button"
                fullWidth={false}
                loading={isCropping}
                disabled={isCropping}
                onClick={handleSaveCrop}
                className="h-11 min-w-[140px]"
              >
                Save Crop
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImageCropperModal;