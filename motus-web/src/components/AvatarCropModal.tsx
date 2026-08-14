import { useCallback, useState } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { Check, Loader2, Minus, Plus, X } from "lucide-react";
import { cropImageToBlob } from "../utils/imageCrop";
import "react-easy-crop/react-easy-crop.css";

interface AvatarCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export default function AvatarCropModal({
  imageSrc,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleZoomStep = (delta: number) => {
    setZoom((current) => Math.min(3, Math.max(1, Number((current + delta).toFixed(2)))));
  };

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    try {
      setSaving(true);
      setError("");
      const blob = await cropImageToBlob(imageSrc, croppedAreaPixels);
      onConfirm(new File([blob], "avatar.png", { type: "image/png" }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not crop the image.",
      );
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onCancel();
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-bold text-foreground">Crop your photo</h2>
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-full p-2 text-muted transition hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
            aria-label="Cancel cropping"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative h-72 w-full overflow-hidden rounded-lg bg-black sm:h-80">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => handleZoomStep(-0.1)}
              disabled={saving || zoom <= 1}
              className="rounded-lg border border-border p-2 text-muted transition hover:bg-surface-hover disabled:opacity-40"
              aria-label="Zoom out"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              disabled={saving}
              className="h-1.5 w-full cursor-pointer accent-primary"
              aria-label="Zoom"
            />
            <button
              onClick={() => handleZoomStep(0.1)}
              disabled={saving || zoom >= 3}
              className="rounded-lg border border-border p-2 text-muted transition hover:bg-surface-hover disabled:opacity-40"
              aria-label="Zoom in"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="w-12 text-right text-sm font-semibold text-muted">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {error && (
            <p className="mt-3 text-sm font-medium text-error">{error}</p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-hover disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {saving ? "Cropping…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
