import {notFound} from "next/navigation";
import Link from "next/link";
import {getArtistByStageName} from "@/lib/data-service";
import {getSession} from "@/lib/auth";
import {storageQuotaBytes} from "@/lib/artist-media-policy";
import {ArtistStage} from "@/components/artist/ArtistStage";
import {TrackCrate} from "@/components/artist/TrackCrate";
import {FreestyleVault} from "@/components/artist/FreestyleVault";
import {FlyerCarousel} from "@/components/artist/FlyerCarousel";
import {ServiceBookingModal} from "@/components/artist/ServiceBookingModal";
interface ArtistPageProps {params:Promise<{stageName:string}>;}
export const dynamic="force-dynamic";
export default async function ArtistZonePage({params}:ArtistPageProps) {
 const {stageName}=await params;
 let decodedStageName:string;
 try{decodedStageName=decodeURIComponent(stageName);}catch{notFound();}
 const artist=await getArtistByStageName(decodedStageName);
 if(!artist)notFound();
 const session=await getSession();
 const owner=session?.userId===artist.userId;
 const playbackArtist=owner?{...artist,tracks:artist.tracks?.map(track=>({...track,playbackUrl:`/api/tracks/${track.id}/stream`}))}:artist;
 return <div className="min-h-screen pb-24 max-w-7xl mx-auto px-4 lg:px-8">
  <nav className="flex items-center gap-2 pt-6 pb-5 text-xs text-ug-muted" aria-label="Breadcrumb"><Link href="/" className="hover:text-white">Home</Link><span>/</span><span className="text-white">{artist.stageName}'s Zone</span></nav>
  <header className="flex flex-wrap items-center justify-between gap-4 mb-5">
   <div className="flex items-center gap-3">{artist.portrait&&<img src={artist.portrait.url} alt={`${artist.stageName} portrait`} className="h-12 w-12 rounded-full object-cover border-2 border-ug-gold/50"/>}<div><p className="text-[10px] font-mono uppercase tracking-[.2em] text-ug-gold">Virtual artist zone</p><h1 className="font-black text-2xl md:text-3xl text-white mt-1">{artist.stageName}</h1></div><span className="rounded-full border border-ug-border bg-ug-card px-3 py-1 text-[10px] uppercase text-ug-gold">{artist.subgenre}</span></div>
   <div className="text-xs text-ug-muted">{artist.tracks?.length||0}/10 MP3s ? {artist.youtubeVideos?.length||0}/10 videos{owner&&<><p className="mt-1 text-right">{(artist.storageUsedBytes/1048576).toFixed(1)} MB / {storageQuotaBytes(artist.subscriptionTier)/1048576} MB</p><Link href="/dashboard" className="block mt-1 text-right text-ug-gold">Edit your artist stage ?</Link></>}</div>
  </header>
  <div className="space-y-8"><ArtistStage artist={playbackArtist}/><TrackCrate tracks={playbackArtist.tracks||[]} stageName={artist.stageName}/>
   {!!artist.freestyles?.length&&<FreestyleVault freestyles={artist.freestyles} stageName={artist.stageName}/>}
   {!!artist.eventFlyers?.length&&<FlyerCarousel flyers={artist.eventFlyers}/>}
   <ServiceBookingModal services={artist.services} artistId={artist.id} stageName={artist.stageName}/>
  </div>
 </div>;
}
