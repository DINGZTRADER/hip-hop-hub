export type YouTubePlayer = {pauseVideo:()=>void;destroy:()=>void;getVideoData:()=>{video_id:string};loadVideoById:(id:string,startSeconds:number)=>void;mute:()=>void;setVolume:(volume:number)=>void;unMute:()=>void};
type PlayerEvent={data:number;target:YouTubePlayer};
type YouTubeNamespace={Player:new(element:HTMLElement,options:{width?:string;height?:string;videoId?:string;playerVars?:Record<string,string|number>;events:{onReady?:(event:PlayerEvent)=>void;onStateChange?:(event:PlayerEvent)=>void;onError?:(event:PlayerEvent)=>void;onAutoplayBlocked?:()=>void}})=>YouTubePlayer};
declare global {interface Window {YT?:YouTubeNamespace;onYouTubeIframeAPIReady?:()=>void;}}
let loading:Promise<YouTubeNamespace>|null=null;
export function loadYouTubeApi():Promise<YouTubeNamespace> {
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(loading)return loading;
 loading=new Promise((resolve,reject)=>{
  const previous=window.onYouTubeIframeAPIReady;
  const timeout=window.setTimeout(()=>{loading=null;reject(new Error('YouTube controls unavailable'));},20000);
  window.onYouTubeIframeAPIReady=()=>{previous?.();window.clearTimeout(timeout);if(window.YT?.Player)resolve(window.YT);else reject(new Error('YouTube unavailable'));};
  if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{window.clearTimeout(timeout);loading=null;script.remove();reject(new Error('YouTube unavailable'));};document.head.appendChild(script);}
 });return loading;
}
