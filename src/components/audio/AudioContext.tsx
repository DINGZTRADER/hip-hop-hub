"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { Track } from "@/types";

interface AudioContextType {
  currentTrack: Track | null;
  playCounts: Record<string, number>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  selectedTrackForPurchase: Track | null;
  openCheckout: (track: Track) => void;
  closeCheckout: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [selectedTrackForPurchase, setSelectedTrackForPurchase] = useState<Track | null>(null);

  const [playCounts,setPlayCounts]=useState<Record<string,number>>({});
  const selectedTrackId=useRef<string|null>(null);
  const listening=useRef<{startedAt:number;trackId:string;ticket:string;seconds:number;listened:number;lastTime:number;counted:boolean;pending:boolean;retryAt:number}|null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      const audio = audioRef.current;

      const ensureListeningSession = () => {
        const trackId=selectedTrackId.current; if(!trackId) return;
        if(listening.current && Date.now()-listening.current.startedAt<30*60*1000) return;
        const session={startedAt:Date.now(),trackId,ticket:"",seconds:30,listened:0,lastTime:audio.currentTime,counted:false,pending:false,retryAt:0}; listening.current=session;
        fetch(`/api/tracks/${trackId}/play`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({phase:"start"})}).then(async response=>{if(response.ok){const result=await response.json();session.ticket=result.ticket;session.seconds=result.seconds;}}).catch(()=>{});
      };
      const handleTimeUpdate = () => {
        if(!audio.paused) ensureListeningSession();
        if (audio) setCurrentTime(audio.currentTime);
        const session=listening.current;
        if(session&&!audio.paused){const delta=audio.currentTime-session.lastTime;session.lastTime=audio.currentTime;if(delta>0&&delta<2)session.listened+=delta;if(!session.counted&&!session.pending&&Date.now()>=session.retryAt&&session.ticket&&session.listened>=session.seconds){session.pending=true;session.retryAt=Date.now()+30000;fetch(`/api/tracks/${session.trackId}/play`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phase:'complete',ticket:session.ticket})}).then(async response=>{if(response.ok){const result=await response.json();session.counted=true;setPlayCounts(previous=>({...previous,[session.trackId]:result.playCount}));}}).catch(()=>{}).finally(()=>{session.pending=false;});}}

      };

      const handleLoadedMetadata = () => {
        if (audio) setDuration(audio.duration || 0);
      };

      const handleEnded = () => {
        listening.current=null;
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handlePlay = () => {ensureListeningSession();setIsPlaying(true);};
      const handlePause = () => setIsPlaying(false);

      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
        audio.removeEventListener("play", handlePlay);
        audio.removeEventListener("pause", handlePause);
        audio.pause();
      };
    }
  }, []);

  const playTrack = (track: Track) => {
    const source = track.playbackUrl || track.previewUrl;
    if (!audioRef.current || !source) return;

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      return;
    }

    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);
    audioRef.current.src = source;
    selectedTrackId.current=track.id; listening.current=null;
    audioRef.current.play().catch((err) => {
      console.warn("Audio autoplay blocked or failed:", err);
    });

  };

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      pauseTrack();
    } else {
      audioRef.current.play().catch(console.error);

    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      if(listening.current)listening.current.lastTime=time;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  };

  const openCheckout = (track: Track) => {
    setSelectedTrackForPurchase(track);
  };

  const closeCheckout = () => {
    setSelectedTrackForPurchase(null);
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        playCounts,
        isPlaying,
        currentTime,
        duration,
        volume,
        playTrack,
        pauseTrack,
        togglePlay,
        seek,
        setVolume,
        selectedTrackForPurchase,
        openCheckout,
        closeCheckout,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
