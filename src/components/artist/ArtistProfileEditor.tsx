"use client";
import { useRef, useState } from "react";
import { Artist, ArtistImage } from "@/types";
import { ArtistVideoInput, MAX_ARTIST_PHOTOS } from "@/lib/artist-media-policy";
import { ArtistImageUpload } from "./ArtistImageUpload";
import { YouTubeLinksEditor } from "./YouTubeLinksEditor";

export type ArtistProfileDraft = {bio:string;phoneForBookings:string;bookingEmail:string;websiteUrl:string;portrait:ArtistImage|null;photos:ArtistImage[];youtubeVideos:ArtistVideoInput[];originalsConfirmed:boolean};
export function emptyArtistProfileDraft(artist?: Artist): ArtistProfileDraft {
  return {bio:artist?.bio || "",phoneForBookings:artist?.phoneForBookings || "",bookingEmail:artist?.bookingEmail || "",websiteUrl:artist?.websiteUrl || "",portrait:artist?.portrait || null,photos:artist?.photos || [],youtubeVideos:artist?.youtubeVideos?.map(video=>({youtubeUrl:video.youtubeUrl,videoTitle:video.videoTitle || ""})) || [],originalsConfirmed:false};
}
export function artistProfilePayload(value:ArtistProfileDraft) {return {bio:value.bio,phoneForBookings:value.phoneForBookings,bookingEmail:value.bookingEmail,websiteUrl:value.websiteUrl,portraitImageId:value.portrait?.id || null,galleryImageIds:value.photos.map(image=>image.id),youtubeVideos:value.youtubeVideos.filter(video=>video.youtubeUrl.trim()),originalsConfirmed:value.originalsConfirmed};}
export function ArtistProfileEditor({value,onChange,onBusyChange,onError,showContacts=true,showVideos=true}: {value:ArtistProfileDraft;onChange:(value:ArtistProfileDraft)=>void;onBusyChange:(busy:boolean)=>void;onError:(message:string)=>void;showContacts?:boolean;showVideos?:boolean}) {
  const [busySlots,setBusySlots] = useState<string[]>([]);
  const activeSlots=useRef(new Set<string>());
  const busy=(slot:string,loading:boolean)=>{if(loading)activeSlots.current.add(slot);else activeSlots.current.delete(slot);const next=[...activeSlots.current];setBusySlots(next);onBusyChange(next.length>0);};
  const movePhoto = (index:number,delta:number)=>{const photos=[...value.photos];[photos[index],photos[index+delta]]=[photos[index+delta],photos[index]];onChange({...value,photos});};
  return <div className="space-y-6">
    {showContacts && <div className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2 block text-xs text-ug-muted">Artist bio<textarea value={value.bio} maxLength={3000} onChange={e=>onChange({...value,bio:e.target.value})} className="mt-1 block w-full rounded-xl bg-ug-card border border-ug-border p-3 text-white"/></label>
      <label className="block text-xs text-ug-muted">Public booking phone<input value={value.phoneForBookings} maxLength={50} onChange={e=>onChange({...value,phoneForBookings:e.target.value})} className="mt-1 w-full rounded-xl border border-ug-border bg-ug-card p-3 text-white"/></label>
      <label className="block text-xs text-ug-muted">Booking email (public)<input type="email" value={value.bookingEmail} maxLength={255} onChange={e=>onChange({...value,bookingEmail:e.target.value})} className="mt-1 w-full rounded-xl border border-ug-border bg-ug-card p-3 text-white"/></label>
    </div>}
    <label className="block text-xs text-ug-muted">Website (optional)<input type="url" value={value.websiteUrl} onChange={e=>onChange({...value,websiteUrl:e.target.value})} placeholder="https://your-website.com" className="mt-1 w-full rounded-xl border border-ug-border bg-ug-card p-3 text-white"/></label>
    <fieldset disabled={busySlots.length>0} className="grid gap-5 lg:grid-cols-2 disabled:opacity-70">
      <div className="space-y-3"><h3 className="font-bold text-white">Record portrait</h3>
        {value.portrait && <div className="flex items-center gap-3"><img src={value.portrait.url} alt="Record portrait" className="w-16 h-16 rounded-full border-4 border-ug-gold object-cover"/><span className="text-xs break-all text-ug-muted">{value.portrait.filename}</span><button type="button" onClick={()=>onChange({...value,portrait:null})} className="text-xs text-red-300">Remove portrait</button></div>}
        <ArtistImageUpload purpose="portrait" onUploaded={portrait=>onChange({...value,portrait})} onBusyChange={loading=>busy('portrait',loading)} onError={onError}/>
      </div>
      <div className="space-y-3"><h3 className="font-bold text-white">Up to 10 gallery photos ({value.photos.length}/10)</h3>
        <div className="grid grid-cols-2 gap-2">{value.photos.map((photo,index)=><div key={photo.id} className="rounded-xl border border-ug-border p-2"><img src={photo.url} alt={`Gallery photo ${index+1}`} className="h-24 w-full rounded-lg object-cover"/><p className="text-[10px] text-ug-muted truncate mt-1">{photo.filename}</p><div className="flex flex-wrap gap-2 mt-2 text-xs text-ug-gold"><button type="button" disabled={!index} onClick={()=>movePhoto(index,-1)} aria-label={`Move photo ${index+1} up`} className="disabled:opacity-30">↑</button><button type="button" disabled={index===value.photos.length-1} onClick={()=>movePhoto(index,1)} aria-label={`Move photo ${index+1} down`} className="disabled:opacity-30">↓</button><button type="button" onClick={()=>onChange({...value,photos:value.photos.filter(p=>p.id!==photo.id)})} className="text-red-300">Remove</button></div></div>)}</div>
        {value.photos.length<MAX_ARTIST_PHOTOS && <ArtistImageUpload purpose="gallery" onUploaded={image=>onChange({...value,photos:[...value.photos,image]})} onBusyChange={loading=>busy('gallery',loading)} onError={onError}/>}
      </div>
    </fieldset>
    <p className="text-xs text-ug-muted">Photos stay as drafts until you save. Replacing a photo keeps the current published image until the save succeeds.</p>
    {showVideos && <><YouTubeLinksEditor value={value.youtubeVideos} onChange={youtubeVideos=>onChange({...value,youtubeVideos})}/><label className="flex items-start gap-2 text-xs text-ug-muted"><input type="checkbox" checked={value.originalsConfirmed} onChange={e=>onChange({...value,originalsConfirmed:e.target.checked})} className="accent-ug-gold"/>I confirm these tracks and YouTube videos are my original music.</label></>}
  </div>;
}
