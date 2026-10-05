import {Artist} from "@/types";
import {ArtistPhotoSlideshow} from "./ArtistPhotoSlideshow";
export function ArtistContactPanel({artist}:{artist:Artist}) {
 const socials=Object.entries(artist.socials).filter(([,url])=>url&&/^https?:\/\//i.test(url));
 return <aside className="min-w-0 p-5 lg:p-6 space-y-5">
  <div><p className="text-[10px] font-mono uppercase tracking-widest text-ug-gold">Meet the artist</p><h2 className="mt-2 text-lg font-black text-white">{artist.stageName}</h2><p className="text-xs text-ug-muted mt-1">{artist.region} ? {artist.subgenre}</p></div>
  {artist.bio&&<p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line break-words">{artist.bio}</p>}
  <ArtistPhotoSlideshow photos={artist.photos||[]} stageName={artist.stageName}/>
  {(artist.phoneForBookings||artist.bookingEmail||artist.websiteUrl)&&<div className="space-y-2 border-t border-ug-border pt-4"><p className="text-[10px] font-mono uppercase tracking-widest text-ug-muted">Connect & book</p>{artist.phoneForBookings&&<a href={`tel:${artist.phoneForBookings.replace(/[^+0-9]/g,'')}`} className="block text-sm text-white break-all">{artist.phoneForBookings}</a>}{artist.bookingEmail&&<a href={`mailto:${artist.bookingEmail}`} className="block text-xs text-ug-gold break-all">{artist.bookingEmail}</a>}{artist.websiteUrl&&/^https?:\/\//i.test(artist.websiteUrl)&&<a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-ug-gold break-all">{artist.websiteUrl.replace(/^https?:\/\//,'')} ?</a>}</div>}
  {socials.length>0&&<div className="flex flex-wrap gap-2">{socials.map(([name,url])=><a key={name} href={url!} target="_blank" rel="noopener noreferrer" className="rounded-full bg-ug-card border border-ug-border px-3 py-1 text-xs capitalize text-ug-muted">{name==='x'?'X':name} ?</a>)}</div>}
 </aside>;
}
