"use client";
import { ArtistVideoInput, MAX_ARTIST_VIDEOS } from "@/lib/artist-media-policy";
export function YouTubeLinksEditor({value,onChange}: {value: ArtistVideoInput[];onChange:(value:ArtistVideoInput[])=>void}) {
  return <div className="space-y-3">
    <h3 className="font-bold text-white">Up to 10 original YouTube music videos <span className="text-ug-muted text-xs">({value.length}/10)</span></h3>
    {value.map((video,index)=><div key={index} className="rounded-xl border border-ug-border p-3 space-y-2">
      <label className="block text-xs text-ug-muted">Video {index+1} link<input type="url" value={video.youtubeUrl} onChange={e=>onChange(value.map((v,i)=>i===index?{...v,youtubeUrl:e.target.value}:v))} placeholder="https://www.youtube.com/watch?v=…" className="mt-1 w-full rounded-lg border border-ug-border bg-ug-card p-2 text-white"/></label>
      <label className="block text-xs text-ug-muted">Video title<input value={video.videoTitle || ""} maxLength={255} onChange={e=>onChange(value.map((v,i)=>i===index?{...v,videoTitle:e.target.value}:v))} className="mt-1 w-full rounded-lg border border-ug-border bg-ug-card p-2 text-white"/></label>
      <div className="flex gap-3 text-xs text-ug-muted">
        <button type="button" disabled={index===0} onClick={()=>{const copy=[...value];[copy[index-1],copy[index]]=[copy[index],copy[index-1]];onChange(copy);}} className="disabled:opacity-30">Move up</button>
        <button type="button" disabled={index===value.length-1} onClick={()=>{const copy=[...value];[copy[index+1],copy[index]]=[copy[index],copy[index+1]];onChange(copy);}} className="disabled:opacity-30">Move down</button>
        <button type="button" onClick={()=>onChange(value.filter((_,i)=>i!==index))} className="text-red-300">Remove video {index+1}</button>
      </div>
    </div>)}
    <button type="button" disabled={value.length>=MAX_ARTIST_VIDEOS} onClick={()=>onChange([...value,{youtubeUrl:"",videoTitle:""}])} className="rounded-lg border border-ug-border bg-ug-card px-3 py-2 text-xs font-bold text-ug-gold disabled:opacity-40">Add YouTube video</button>
  </div>;
}
