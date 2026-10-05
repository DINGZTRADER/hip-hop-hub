"use client";
import {useEffect,useRef,useState} from "react";
import {ArtistYouTubeVideo} from "@/types";
import {getYouTubeVideoId,MAX_ARTIST_VIDEOS} from "@/lib/artist-media-policy";
import {loadYouTubeApi,YouTubePlayer} from "@/lib/youtube-iframe";
import {useAudio} from "../audio/AudioContext";
export function YouTubeGallery({videos=[],stageName}:{videos?:ArtistYouTubeVideo[];stageName:string}) {
 const valid=videos.filter(video=>getYouTubeVideoId(video.youtubeUrl)).slice(0,MAX_ARTIST_VIDEOS);
 const [selected,setSelected]=useState(0),[error,setError]=useState(''),[origin,setOrigin]=useState('');
 const iframe=useRef<HTMLIFrameElement>(null),player=useRef<YouTubePlayer|null>(null);
 const {pauseTrack,isPlaying}=useAudio();const pause=useRef(pauseTrack),audioPlaying=useRef(isPlaying);pause.current=pauseTrack;audioPlaying.current=isPlaying;
 const video=valid[selected]||valid[0];const id=video?getYouTubeVideoId(video.youtubeUrl):null;
 useEffect(()=>setOrigin(window.location.origin),[]);
 useEffect(()=>{if(isPlaying)player.current?.pauseVideo();},[isPlaying]);
 useEffect(()=>{
  if(!id||!origin||!iframe.current)return;
  let active=true;const frame=iframe.current;setError('');
  loadYouTubeApi().then(api=>{if(!active)return;const current=new api.Player(frame,{events:{onReady:()=>{if(active&&audioPlaying.current)current.pauseVideo();},onStateChange:event=>{if(active&&event.data===1)pause.current();},onError:()=>{if(active)setError('This video cannot play here. Open it on YouTube.');}}});player.current=current;}).catch(()=>{if(active)setError('Video controls unavailable. Open it on YouTube.');});
  return()=>{active=false;const current=player.current;player.current=null;current?.destroy();};
 },[id,origin]);
 return <section className="min-w-0 p-5 lg:p-6 space-y-4">
  <div><p className="text-[10px] font-mono uppercase tracking-widest text-ug-red">Original music videos</p><h2 className="mt-2 text-lg font-black text-white">Watch {stageName}</h2></div>
  {video&&id?<><div className="aspect-video w-full overflow-hidden rounded-xl bg-black border border-ug-border"><iframe key={id} ref={iframe} src={`https://www.youtube.com/embed/${id}?enablejsapi=1&playsinline=1${origin?`&origin=${encodeURIComponent(origin)}`:''}`} title={video.videoTitle||`${stageName} official video`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="h-full w-full border-0"/></div>{error&&<p role="status" className="text-xs text-ug-muted">{error}</p>}<a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" className="block text-xs text-ug-gold">Open selected video on YouTube ?</a><div className="max-h-64 overflow-y-auto space-y-1 pr-1">{valid.map((item,index)=><button key={item.id} type="button" onClick={()=>setSelected(index)} aria-pressed={selected===index} className={`flex items-center gap-3 w-full rounded-xl px-3 py-3 text-left text-xs border ${selected===index?'border-ug-gold/30 bg-ug-gold/10 text-ug-gold':'border-transparent bg-ug-card/40 text-ug-muted hover:text-white'}`}><span className="font-mono text-[10px]">{String(index+1).padStart(2,'0')}</span><span className="min-w-0 break-words">{item.videoTitle||`Official video ${index+1}`}</span></button>)}</div><p className="text-[10px] text-ug-muted">{valid.length} / 10 original music videos</p></>:<div className="rounded-xl border border-dashed border-ug-border px-4 py-8 text-xs text-ug-muted">The artist has not added music videos yet.</div>}
 </section>;
}
