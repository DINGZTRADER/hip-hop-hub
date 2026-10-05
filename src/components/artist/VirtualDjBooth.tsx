"use client";
import { Artist } from "@/types";
import { useAudio } from "../audio/AudioContext";
import { Play, Pause } from "lucide-react";
export function VirtualDjBooth({artist}:{artist:Artist}) {
 const {currentTrack,isPlaying,playTrack,togglePlay}=useAudio();
 const activeTrack=currentTrack?.artistId===artist.id?currentTrack:artist.tracks?.[0];
 const playing=isPlaying&&currentTrack?.artistId===artist.id;
 const playable=!!(activeTrack?.playbackUrl||activeTrack?.previewUrl);
 return <section className="flex min-w-0 flex-col items-center justify-center py-6 px-3 text-center">
  <p className="text-[10px] font-mono uppercase tracking-[.25em] text-ug-gold mb-5">{artist.stageName}'s vinyl deck</p>
  <div className="relative p-3 sm:p-5 rounded-3xl bg-gradient-to-b from-zinc-800/50 to-black/50 border border-zinc-700/50 shadow-2xl">
   <button type="button" disabled={!playable} onClick={()=>{if(activeTrack){if(currentTrack?.id===activeTrack.id)togglePlay();else playTrack(activeTrack);}}} aria-label={playable?`${playing?"Pause":"Play"} ${activeTrack?.title}`:"Preview unavailable"} title={activeTrack?.playbackUrl?"Play / pause your full MP3":playable?"Play / pause preview":"Preview unavailable"} className="group relative flex h-60 w-60 xl:h-72 xl:w-72 items-center justify-center rounded-full vinyl-grooves border-[6px] border-zinc-900 shadow-[0_0_30px_#000] disabled:cursor-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-ug-gold">
    <div className={`relative flex h-28 w-28 xl:h-32 xl:w-32 items-center justify-center rounded-full bg-gradient-to-tr from-ug-red via-ug-gold to-orange-300 border-4 border-black overflow-hidden ${playing?"animate-spin-slow motion-reduce:animate-none":""}`}>
     {artist.portrait?<img src={artist.portrait.url} alt={`${artist.stageName} record portrait`} className="absolute inset-0 w-full h-full object-cover"/>:<span className="px-2 font-black text-black text-xs uppercase">{artist.stageName}</span>}
     <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-black border border-white/20"/>
    </div>
    {playable&&<span className="absolute bottom-5 right-5 grid h-10 w-10 place-items-center rounded-full bg-ug-gold text-black shadow-xl">{playing?<Pause size={18}/>:<Play size={18}/>}</span>}
   </button>
   <span aria-hidden="true" className={`pointer-events-none absolute top-3 right-2 w-2 h-24 rounded-full bg-zinc-400 shadow-lg origin-top transition-transform ${playing?"rotate-12":"-rotate-12"}`}/>
  </div>
  <p className="mt-5 text-[10px] font-mono uppercase tracking-widest text-ug-muted">{playing?"Now playing":"On the record"}</p>
  <h3 className="mt-1 font-black text-xl text-white break-words">{activeTrack?.title||"Your original sound"}</h3>
  {activeTrack&&<p className="mt-1 text-xs text-ug-muted">{Math.floor(activeTrack.durationSeconds/60)}:{(activeTrack.durationSeconds%60).toString().padStart(2,"0")} / MP3 Master / <span className="text-ug-gold">UGX {activeTrack.priceUgx.toLocaleString()}</span></p>}
  {!playable&&activeTrack&&<p className="mt-2 text-xs text-ug-muted">No public preview / buy the original MP3 below</p>}
  {activeTrack?.playbackUrl&&<p className="mt-2 text-xs text-emerald-400">Owner access / play your full MP3</p>}
 </section>;
}
