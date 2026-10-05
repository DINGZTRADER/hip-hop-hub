"use client";
import {useEffect,useState} from "react";
import {ArtistImage} from "@/types";
export function ArtistPhotoSlideshow({photos,stageName}:{photos:ArtistImage[];stageName:string}) {
 const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[reduced,setReduced]=useState(true);
 useEffect(()=>{const query=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(query.matches);update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update);},[]);
 useEffect(()=>{setIndex(0);},[photos]);
 useEffect(()=>{if(photos.length<2||paused||reduced)return;const timer=window.setInterval(()=>setIndex(current=>(current+1)%photos.length),6000);return()=>window.clearInterval(timer);},[photos.length,paused,reduced]);
 if(!photos.length)return null;
 const photo=photos[index%photos.length];
 return <div className="rounded-2xl overflow-hidden border border-ug-border bg-black/30">
  <img src={photo.url} alt={`${stageName} artist photo ${index+1}`} className="aspect-[4/3] w-full object-cover" loading="lazy"/>
  {photos.length>1&&<div className="flex items-center justify-between px-3 py-2 text-xs text-ug-muted"><button type="button" aria-label="Previous artist photo" onClick={()=>{setPaused(true);setIndex((index+photos.length-1)%photos.length);}}>?</button><span>{index+1} / {photos.length}</span><button type="button" onClick={()=>setPaused(!paused)} disabled={reduced} aria-label={paused?"Resume photo slideshow":"Pause photo slideshow"}>{reduced?"Manual":paused?"Resume":"Pause"}</button><button type="button" aria-label="Next artist photo" onClick={()=>{setPaused(true);setIndex((index+1)%photos.length);}}>?</button></div>}
 </div>;
}
