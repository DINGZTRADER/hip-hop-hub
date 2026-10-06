"use client";
import {useEffect,useState} from "react";
import {Artist} from "@/types";

export function BookingRatesEditor({artist,onSaved}:{artist:Artist;onSaved:(artist:Artist)=>void}){
  const initial=()=>Object.fromEntries((artist.services||[]).map(service=>[service.id,String(service.priceUgx)]));
  const [rates,setRates]=useState(initial),[saving,setSaving]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
  useEffect(()=>{setRates(initial());setError("");setSuccess("");},[artist.id]);
  const services=artist.services||[];
  if(!services.length)return null;
  async function save(event:React.FormEvent){
    event.preventDefault();if(saving)return;setError("");setSuccess("");
    const bookingRates=services.map(service=>({serviceId:service.id,priceUgx:Number(rates[service.id])}));
    if(bookingRates.some(rate=>!Number.isSafeInteger(rate.priceUgx)||rate.priceUgx<1||rate.priceUgx>2147483647)){setError("Enter a positive whole UGX rate for each service.");return;}
    setSaving(true);
    try{
      const response=await fetch(`/api/artists/${encodeURIComponent(artist.stageName)}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({bookingRates})});
      const data=await response.json();if(!response.ok)throw new Error(data.error?.message||"Could not save booking rates.");
      setRates(Object.fromEntries((data.artist.services||[]).map((service:{id:string;priceUgx:number})=>[service.id,String(service.priceUgx)])));onSaved(data.artist);setSuccess("Booking rates saved. Your public rate card is updated.");
    }catch(error){setError(error instanceof Error?error.message:"Could not save booking rates.");}finally{setSaving(false);}
  }
  return <section className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 mb-8">
    <h2 className="text-xl font-black text-white">Your booking rates</h2>
    <p className="mt-1 mb-5 text-xs text-ug-muted">Set your public rates in Ugandan shillings. New booking requests use the saved rates. Existing booking quotes stay unchanged.</p>
    <form onSubmit={save}><fieldset disabled={saving} className="grid gap-4 md:grid-cols-3">
      {services.map(service=><label key={service.id} className="text-sm text-white">{service.serviceName}<span className="block mt-1 text-xs text-ug-muted">Rate (UGX)</span><input type="number" required min={1} max={2147483647} step={1} value={rates[service.id]??String(service.priceUgx)} onChange={event=>{setRates(previous=>({...previous,[service.id]:event.target.value}));setSuccess("");}} className="mt-2 w-full rounded-xl border border-ug-border bg-ug-card p-3 text-white"/></label>)}
    </fieldset>{error&&<p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}{success&&<p role="status" className="mt-3 text-sm text-emerald-400">{success}</p>}
    <button disabled={saving} className="mt-5 rounded-full bg-ug-gold px-6 py-3 text-sm font-bold text-black disabled:opacity-40">{saving?"Saving...":"Save booking rates"}</button></form>
  </section>;
}
