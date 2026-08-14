import type { Area } from "react-easy-crop";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the selected image."));
    image.src = src;
  });
}

/**
 * Renders the selected crop region (expressed in the source image's natural
 * pixels by react-easy-crop's onCropComplete) onto a canvas and encodes it as a
 * PNG blob. PNG preserves alpha, so circular avatars stay transparent.
 */
export async function cropImageToBlob(
  imageSrc: string,
  croppedAreaPixels: Area,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(croppedAreaPixels.width));
  canvas.height = Math.max(1, Math.round(croppedAreaPixels.height));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is not available.");
  }

  context.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode the cropped image."))),
      "image/png",
    );
  });
}

/** Reads an uploaded file into a data URL so it can be previewed by the cropper. */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.readAsDataURL(file);
  });
}
