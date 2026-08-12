import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileVideo,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useApi } from "../context/ApiContext";
import { ApiError } from "../types";

export default function UploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const api = useApi();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
      setDone(false);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError("");
      await api.uploadMovie(file, (percent) => setProgress(percent));
      setDone(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      const error = err as ApiError;
      setError(
        error.response?.data?.message ||
          "An error occurred while uploading. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-bold text-foreground">Upload Media</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-full p-2 text-muted transition hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {!file ? (
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-10 transition-colors hover:border-primary/50 hover:bg-surface-hover"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="mb-4 h-12 w-12 text-muted" />
              <p className="mb-2 font-medium text-foreground">
                Click to select video
              </p>
              <p className="text-sm text-muted">Supports MP4, MKV, AVI</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              <div className="flex items-center space-x-4 rounded-lg border border-border bg-background p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileVideo className="h-6 w-6" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p
                    className="truncate font-medium text-foreground"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <p className="text-sm text-muted">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                {!uploading && !done && (
                  <button
                    onClick={() => setFile(null)}
                    className="rounded-full p-2 text-muted hover:bg-surface-hover hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {error && (
                <div className="flex items-center space-x-2 rounded bg-error/10 p-3 text-sm text-error">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {uploading || done ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">
                      {done ? "Upload complete!" : "Uploading..."}
                    </span>
                    <span className="text-muted">{progress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {!done && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full rounded bg-primary py-3 font-bold text-white transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload File"}
                </button>
              )}

              {done && (
                <div className="flex flex-col items-center justify-center py-4 text-green-500">
                  <CheckCircle2 className="mb-2 h-10 w-10" />
                  <p className="font-medium">
                    File successfully uploaded and scanned.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
