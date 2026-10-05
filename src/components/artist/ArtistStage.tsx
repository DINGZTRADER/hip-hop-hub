import {Artist} from "@/types";
import {ArtistContactPanel} from "./ArtistContactPanel";
import {VirtualDjBooth} from "./VirtualDjBooth";
import {YouTubeGallery} from "./YouTubeGallery";
export function ArtistStage({artist}:{artist:Artist}) {return <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1.15fr)_minmax(0,1.2fr)] overflow-hidden rounded-3xl border border-ug-border bg-gradient-to-br from-[#171924] to-[#0d0e15] shadow-2xl lg:divide-x divide-ug-border"><ArtistContactPanel artist={artist}/><VirtualDjBooth artist={artist}/><YouTubeGallery videos={artist.youtubeVideos} stageName={artist.stageName}/></div>;}
