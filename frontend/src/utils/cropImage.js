const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));

    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getRadianAngle = (degreeValue) => {
  return (degreeValue * Math.PI) / 180;
};

export const getCroppedImageFile = async ({
  imageSrc,
  pixelCrop,
  rotation = 0,
  fileName = "cropped-image.jpg",
  mimeType = "image/jpeg",
}) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  const rotRad = getRadianAngle(rotation);

  const safeArea =
    Math.max(image.width, image.height) * 2;

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(rotRad);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width / 2,
    safeArea / 2 - image.height / 2
  );

  const data = ctx.getImageData(
    safeArea / 2 - image.width / 2 + pixelCrop.x,
    safeArea / 2 - image.height / 2 + pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(data, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (fileBlob) => {
        if (!fileBlob) {
          reject(new Error("Canvas is empty"));
          return;
        }

        resolve(fileBlob);
      },
      mimeType,
      0.92
    );
  });

  return new File([blob], fileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
};