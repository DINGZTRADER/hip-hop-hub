"use client";
import { useEffect, useRef, useState } from "react";
import { ArtistImage } from "@/types";
import { MAX_IMAGE_BYTES } from "@/lib/artist-media-policy";

export function ArtistImageUpload({ purpose, onUploaded, onBusyChange, onError }: {
  purpose: "portrait" | "gallery"; onUploaded: (image: ArtistImage) => void; onBusyChange: (busy: boolean) => void; onError: (error: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(0);
  const [dimensions, setDimensions] = useState({width: 0, height: 0});
  const [position, setPosition] = useState(50);
  useEffect(() => {
    if (!file) {setPreview(""); return;}
    const url = URL.createObjectURL(file); setPreview(url);
    const image = new Image(); image.onload = () => setDimensions({width: image.naturalWidth, height: image.naturalHeight}); image.src = url;
    return () => {image.onload = null; URL.revokeObjectURL(url);};
  }, [file]);
  useEffect(() => () => {xhrRef.current?.abort();}, []);
  const upload = () => {
    if (!file || busy || !dimensions.width) return;
    const body = new FormData(); body.set("file", file); body.set("purpose", purpose);
    if (purpose === "portrait") {
      const size = Math.min(dimensions.width, dimensions.height);
      body.set("crop", JSON.stringify({size, left: Math.round((dimensions.width-size)*position/100), top: Math.round((dimensions.height-size)*position/100)}));
    }
    const xhr = new XMLHttpRequest(); xhrRef.current = xhr;
    setBusy(true); onBusyChange(true); onError(""); setProgress(0);
    const finish = () => {setBusy(false);onBusyChange(false);xhrRef.current = null;};
    xhr.open("POST", "/api/artist-images"); xhr.timeout = 60000;
    xhr.upload.onprogress = event => {if(event.lengthComputable) setProgress(Math.round(event.loaded/event.total*100));};
    xhr.onload = () => {
      try {const response = JSON.parse(xhr.responseText); if(xhr.status < 200 || xhr.status >= 300) throw new Error(response.error?.message || "Image upload failed."); onUploaded(response.image); setFile(null);}
      catch(error) {onError(error instanceof Error ? error.message : "Image upload failed.");}
      finish();
    };
    xhr.onerror = xhr.ontimeout = () => {onError("Image upload failed. Your saved photos are unchanged; try again."); finish();};
    xhr.onabort = finish;
    xhr.send(body);
  };
  return <div className="rounded-xl border border-ug-border bg-black/20 p-3 space-y-3">
    <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event=>{
      const chosen = event.target.files?.[0]; event.target.value = ""; if(!chosen) return;
      if(chosen.size > MAX_IMAGE_BYTES || !["image/jpeg","image/png","image/webp"].includes(chosen.type)) {onError("Choose a JPG, PNG or WebP image up to 2 MB.");return;}
      onError("");setDimensions({width:0,height:0});setPosition(50);setFile(chosen);
    }}/>
    <button type="button" disabled={busy} onClick={()=>input.current?.click()} className="rounded-lg bg-ug-card border border-ug-border px-3 py-2 text-xs font-bold text-ug-gold disabled:opacity-50">Choose {purpose === "portrait" ? "record portrait" : "gallery photo"}</button>
    <p className="text-xs text-ug-muted">JPG, PNG or WebP · up to 2 MB · still images only</p>
    {file && <div className="space-y-2">
      {/* Local preview is safe raster data; server validates and strips metadata again. */}
      {preview && <img src={preview} alt="Selected artist image crop" className={purpose === "portrait" ? "h-32 w-32 rounded-full object-cover border-4 border-ug-gold" : "h-32 max-w-full rounded-lg object-contain"} style={{objectPosition:`${position}% ${position}%`}}/>}
      <p className="text-xs break-all text-white">{file.name}</p>
      {purpose === "portrait" && <label className="block text-xs text-ug-muted">Adjust portrait crop<input aria-label="Portrait crop position" type="range" min={0} max={100} value={position} disabled={busy} onChange={e=>setPosition(Number(e.target.value))} className="block w-full accent-ug-gold"/></label>}
      <button type="button" onClick={upload} disabled={busy || !dimensions.width} className="rounded-lg bg-ug-gold px-4 py-2 text-xs font-bold text-black disabled:opacity-50">{busy ? `Uploading ${progress}%` : "Upload selected image"}</button>
      <p role="status" className="text-xs text-ug-muted">{busy ? progress === 100 ? "Checking and optimizing image…" : "Uploading image…" : "Upload, then save your profile to publish."}</p>
    </div>}
  </div>;
}
