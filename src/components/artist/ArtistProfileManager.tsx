"use client";
import { useEffect, useState } from "react";
import { Artist } from "@/types";
import { normalizeArtistVideos } from "@/lib/artist-media-policy";
import { ArtistProfileEditor, artistProfilePayload, emptyArtistProfileDraft } from "./ArtistProfileEditor";
export function ArtistProfileManager({artist,onSaved}:{artist:Artist;onSaved:(artist:Artist)=>void}) {
  const [draft,setDraft]=useState(()=>emptyArtistProfileDraft(artist));
  const [busy,setBusy]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
  useEffect(()=>{setDraft(emptyArtistProfileDraft(artist));},[artist.id]);
  return <section className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 my-8">
    <h2 className="text-xl font-black text-white">Your artist stage</h2><p className="text-xs text-ug-muted mt-1 mb-5">Record portrait, photo loop, public contacts and up to 10 original YouTube music videos.</p>
    <form onSubmit={async event=>{event.preventDefault();if(busy||saving)return;setSaving(true);setError("");setSuccess("");try{const fullPayload=artistProfilePayload(draft);const {youtubeVideos,originalsConfirmed,...profile}=fullPayload;const sameVideos=JSON.stringify(normalizeArtistVideos(youtubeVideos))===JSON.stringify(normalizeArtistVideos((artist.youtubeVideos||[]).map(video=>({youtubeUrl:video.youtubeUrl,videoTitle:video.videoTitle||undefined}))));const payload=sameVideos?profile:fullPayload;const response=await fetch(`/api/artists/${encodeURIComponent(artist.stageName)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.error?.message||"Could not save profile.");setDraft(emptyArtistProfileDraft(data.artist));onSaved(data.artist);setSuccess("Artist stage saved. Your public page is updated.");}catch(err){setError(err instanceof Error?err.message:"Could not save profile.");}finally{setSaving(false);}}}>
      <fieldset disabled={saving}><ArtistProfileEditor value={draft} onChange={value=>{setDraft(value);setSuccess("");}} onBusyChange={setBusy} onError={setError}/></fieldset>
      {error&&<p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}{success&&<p role="status" className="mt-3 text-sm text-emerald-400">{success}</p>}
      <button disabled={busy||saving} className="mt-5 rounded-full bg-ug-gold px-6 py-3 font-bold text-sm text-black disabled:opacity-40">{saving?"Saving…":"Save artist stage"}</button>
    </form>
  </section>;
}
