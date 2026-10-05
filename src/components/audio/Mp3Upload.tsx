"use client";

import { useState } from "react";
import { uploadPresigned } from "@vercel/blob/client";

export type UploadedMp3 = { fileUrl: string; filesizeBytes: number; durationSeconds: number; masterUploadId: string; masterName: string };

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    const finish = (duration?: number) => {
      clearTimeout(timeout);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(url);
      if (duration && Number.isFinite(duration)) resolve(Math.ceil(duration));
      else reject(new Error("Could not read this MP3. Check the file and try again."));
    };
    const timeout = window.setTimeout(() => finish(), 15000);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => finish(audio.duration);
    audio.onerror = () => finish();
    audio.src = url;
  });
}

export function Mp3Upload({value, onUploaded, onBusyChange, onError}: {
  value: Pick<UploadedMp3, "masterName" | "filesizeBytes" | "masterUploadId">;
  onUploaded: (value: UploadedMp3) => void;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const upload = async (file: File) => {
    if (busy) return;
    onError("");
    if (!/\.mp3$/i.test(file.name) || (file.type && !["audio/mpeg", "audio/mp3"].includes(file.type))) {
      onError("Choose an MP3 audio file."); return;
    }
    if (file.size < 1024 || file.size > 50 * 1048576) {
      onError("Full MP3 must be between 1 KB and 50 MB."); return;
    }
    setBusy(true); onBusyChange(true); setProgress(0);
    let uploadId = "";
    const release = async (id: string) => {
      const response = await fetch("/api/media-uploads/confirm", {method: "DELETE", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id})});
      if (!response.ok) throw new Error("Could not remove the previous MP3 upload. Please try again.");
    };
    try {
      const durationSeconds = await readDuration(file);
      const session = await (await fetch("/api/auth/me", {cache: "no-store"})).json();
      const userId = session.user?.userId;
      if (!session.authenticated || !userId) throw new Error("Sign in before uploading your MP3.");
      uploadId = crypto.randomUUID();
      const blob = await uploadPresigned(`music/${userId}/master/${uploadId}.mp3`, file, {
        access: "private", contentType: "audio/mpeg", handleUploadUrl: "/api/media-uploads",
        clientPayload: JSON.stringify({size: file.size}),
        onUploadProgress: event => setProgress(Math.round(event.percentage)),
      });
      const response = await fetch("/api/media-uploads/confirm", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({id: uploadId, url: blob.url})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || "Could not verify the upload.");
      if (value.masterUploadId) await release(value.masterUploadId);
      onUploaded({fileUrl: result.url, filesizeBytes: result.size, durationSeconds, masterUploadId: uploadId, masterName: file.name});
    } catch (error) {
      if (uploadId) await release(uploadId).catch(() => {});
      onError(error instanceof Error ? error.message : "MP3 upload failed. Try again.");
    } finally { setBusy(false); onBusyChange(false); }
  };
  return <div>
    <label className="block text-xs font-semibold text-white">
      Full MP3 (private, up to 50 MB)
      <input type="file" accept=".mp3,audio/mpeg" disabled={busy}
        onChange={event => {const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file);}}
        className="mt-1 block w-full rounded-xl border border-ug-border bg-ug-surface px-3 py-2 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-ug-gold file:px-3 file:py-2 file:font-bold file:text-black" />
    </label>
    {value.masterName && <p className="mt-1 text-xs text-emerald-400">Uploaded: {value.masterName} ({(value.filesizeBytes / 1048576).toFixed(1)} MB)</p>}
    {busy && <p role="status" className="text-xs text-ug-gold">Uploading full MP3: {progress}%</p>}
  </div>;
}
