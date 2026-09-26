"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Disc3,
  Music,
  Video,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  UploadCloud,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function ArtistOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Step 1: Artist Profile
  const [profile, setProfile] = useState({
    stageName: "",
    realName: "",
    dob: "1998-05-14",
    region: "Kampala",
    subgenre: "Luga Flow",
    bio: "",
    instagram: "",
    x: "",
    youtube: "",
    phoneForBookings: "",
    bookingEmail: "",
  });

  // Step 2: Minimum 3, Maximum 10 MP3 Tracks
  const [tracks, setTracks] = useState<Array<{
    title: string;
    durationSeconds: number;
    priceUgx: number;
    fileUrl: string;
    previewUrl: string;
    filesizeBytes: number;
  }>>([
    {
      title: "Kampala Cypher Anthem",
      durationSeconds: 210,
      priceUgx: 3000,
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      filesizeBytes: 8500000,
    },
    {
      title: "Luga Flow Heatwave",
      durationSeconds: 195,
      priceUgx: 3000,
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      filesizeBytes: 7800000,
    },
    {
      title: "Streets of Uganda",
      durationSeconds: 220,
      priceUgx: 3500,
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      filesizeBytes: 8900000,
    },
  ]);

  // Step 3: 3 YouTube Links & 1 MP4 Video
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>([
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    "https://www.youtube.com/watch?v=9bZkp7q19f0",
  ]);

  const [heroVideoMp4Url, setHeroVideoMp4Url] = useState<string>(
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
  );

  // Step 4: Event Flyer & Freestyle
  const [flyer, setFlyer] = useState({
    title: "Uganda Hip Hop Festival Live",
    eventDate: "2026-11-28T18:00:00Z",
    venue: "Lugogo Cricket Oval",
    flyerImageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
  });

  const [freestyle, setFreestyle] = useState({
    title: "Raw Kampala 64-Bars Freestyle",
    mediaUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    mediaType: "AUDIO" as "AUDIO" | "VIDEO",
  });

  // Step 5: Function Services
  const [services, setServices] = useState([
    { serviceName: "Wedding / Kwanjula Performance", description: "Live 35-minute acoustic & hip-hop set.", priceUgx: 3500000 },
    { serviceName: "Club / Birthday Party Appearance", description: "Energetic headline performance.", priceUgx: 1800000 },
    { serviceName: "Guest Verse Collaboration", description: "16-bar featured verse delivery.", priceUgx: 1200000 },
  ]);

  // Calculate current storage in MB (max 500MB)
  const trackBytes = tracks.reduce((acc, t) => acc + t.filesizeBytes, 0);
  const videoBytes = 25000000; // ~25MB for 10s video
  const totalStorageMB = ((trackBytes + videoBytes) / (1024 * 1024)).toFixed(1);

  const addTrackRow = () => {
    if (tracks.length >= 10) {
      alert("Free tier allows a maximum of 10 tracks. Upgrade to UG Cypher Pro for unlimited tracks.");
      return;
    }
    setTracks([
      ...tracks,
      {
        title: `Track #${tracks.length + 1}`,
        durationSeconds: 180,
        priceUgx: 3000,
        fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        previewUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
        filesizeBytes: 8000000,
      },
    ]);
  };

  const removeTrackRow = (index: number) => {
    if (tracks.length <= 3) {
      alert("Minimum 3 original MP3 tracks are required for Ugandan Hip-Hop artist registration.");
      return;
    }
    setTracks(tracks.filter((_, idx) => idx !== index));
  };

  const handleSubmitRegistration = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageName: profile.stageName,
          realName: profile.realName,
          dob: profile.dob,
          bio: profile.bio,
          region: profile.region,
          subgenre: profile.subgenre,
          socials: {
            instagram: profile.instagram,
            x: profile.x,
            youtube: profile.youtube,
          },
          phoneForBookings: profile.phoneForBookings,
          bookingEmail: profile.bookingEmail,
          heroVideoMp4Url,
          youtubeVideos: youtubeLinks,
          initialTracks: tracks,
          eventFlyer: flyer,
          freestyle,
          services,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to register artist.");
      }

      router.push(`/artist/${encodeURIComponent(profile.stageName)}`);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred during registration.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-ug-gold">
          FREE REGISTRATION FOR UGANDAN HIP-HOP ARTISTS
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-white mt-1">
          Join the Ugandan Cypher
        </h1>
        <p className="text-xs md:text-sm text-ug-muted mt-2 max-w-lg mx-auto">
          Upload your original tracks, 10s video highlight, and booking rate-cards. Keep 80% on every mobile money download.
        </p>

        {/* 500MB Quota Live Counter */}
        <div className="mt-4 inline-flex items-center gap-2 bg-ug-surface px-4 py-1.5 rounded-full border border-ug-border text-xs">
          <UploadCloud className="w-4 h-4 text-ug-gold" />
          <span className="text-ug-muted">Current Estimated Upload:</span>
          <span className="font-bold text-white">{totalStorageMB} MB / 500 MB Free Quota</span>
        </div>
      </div>

      {/* Progress Steps Nav */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
        {[
          { num: 1, label: "Profile" },
          { num: 2, label: "MP3 Tracks (Min 3)" },
          { num: 3, label: "10s MP4 & YouTube" },
          { num: 4, label: "Flyer & Freestyle" },
          { num: 5, label: "Gig Rates" },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setCurrentStep(s.num)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition shrink-0 ${
              currentStep === s.num
                ? "bg-ug-gold text-black shadow-md"
                : currentStep > s.num
                ? "bg-ug-card text-emerald-400 border border-ug-border"
                : "bg-ug-surface text-ug-muted border border-ug-border"
            }`}
          >
            <span>Step {s.num}: {s.label}</span>
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-ug-red/20 border border-ug-red text-red-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-ug-red" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Contents */}
      <div className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-10 shadow-2xl">
        {/* STEP 1: Profile & Identity */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Disc3 className="w-5 h-5 text-ug-gold" />
              <span>Step 1: Emcee Identity & Socials</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Stage Name *
                </label>
                <input
                  type="text"
                  required
                  value={profile.stageName}
                  onChange={(e) => setProfile({ ...profile, stageName: e.target.value })}
                  placeholder="e.g. Navio, GNL Zamba, Feffe Bussi"
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Real / Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={profile.realName}
                  onChange={(e) => setProfile({ ...profile, realName: e.target.value })}
                  placeholder="e.g. Daniel Lubwama Kigozi"
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Date of Birth (DOB) *
                </label>
                <input
                  type="date"
                  required
                  value={profile.dob}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Region *
                </label>
                <select
                  value={profile.region}
                  onChange={(e) => setProfile({ ...profile, region: e.target.value })}
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                >
                  <option value="Kampala">Kampala & Central</option>
                  <option value="Gulu">Gulu & Northern Region</option>
                  <option value="Jinja">Jinja & Eastern Region</option>
                  <option value="Mbarara">Mbarara & Western Region</option>
                  <option value="Tororo">Tororo</option>
                  <option value="Mbale">Mbale</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Hip-Hop Subgenre *
                </label>
                <select
                  value={profile.subgenre}
                  onChange={(e) => setProfile({ ...profile, subgenre: e.target.value })}
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                >
                  <option value="Luga Flow">Luga Flow (Luganda)</option>
                  <option value="Uga-Flow / Hip Hop">Uga-Flow (English)</option>
                  <option value="Luo Rap / Northern Flow">Luo Rap (Acholi / Lango)</option>
                  <option value="Runya-Flow">Runya-Flow (Western)</option>
                  <option value="Afro-Drill / Trap">Afro-Drill & Trap</option>
                  <option value="Boom-Bap">Boom-Bap Classic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ug-muted mb-1">
                Artist Bio & Story
              </label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell your story, musical influences, and career milestones..."
                className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Instagram Handle / URL
                </label>
                <input
                  type="text"
                  value={profile.instagram}
                  onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  X / Twitter Handle
                </label>
                <input
                  type="text"
                  value={profile.x}
                  onChange={(e) => setProfile({ ...profile, x: e.target.value })}
                  placeholder="https://x.com/..."
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Booking Phone (WhatsApp)
                </label>
                <input
                  type="text"
                  value={profile.phoneForBookings}
                  onChange={(e) => setProfile({ ...profile, phoneForBookings: e.target.value })}
                  placeholder="+256 7..."
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!profile.stageName || !profile.realName) {
                    setErrorMsg("Stage name and real name are required.");
                    return;
                  }
                  setErrorMsg("");
                  setCurrentStep(2);
                }}
                className="bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-8 py-3 rounded-full transition shadow-md"
              >
                Next: Upload MP3 Tracks →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Minimum 3, Maximum 10 Tracks */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Music className="w-5 h-5 text-ug-gold" />
                  <span>Step 2: Original MP3 Tracks ({tracks.length}/10)</span>
                </h2>
                <p className="text-xs text-ug-muted mt-1">
                  Specification: Minimum 3 tracks, maximum 10 tracks for free tier.
                </p>
              </div>

              <button
                type="button"
                onClick={addTrackRow}
                className="flex items-center gap-1.5 bg-ug-card hover:bg-ug-border text-ug-gold text-xs font-bold px-4 py-2 rounded-full border border-ug-border transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Track</span>
              </button>
            </div>

            <div className="space-y-3">
              {tracks.map((track, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-ug-card border border-ug-border flex flex-col md:flex-row items-center gap-4"
                >
                  <span className="w-6 text-xs font-mono font-bold text-ug-muted">#{idx + 1}</span>

                  <div className="flex-1 w-full md:w-auto">
                    <input
                      type="text"
                      value={track.title}
                      onChange={(e) => {
                        const copy = [...tracks];
                        copy[idx].title = e.target.value;
                        setTracks(copy);
                      }}
                      placeholder="Track Title"
                      className="w-full bg-ug-surface border border-ug-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-ug-gold"
                    />
                  </div>

                  <div className="w-full md:w-40">
                    <input
                      type="number"
                      value={track.priceUgx}
                      onChange={(e) => {
                        const copy = [...tracks];
                        copy[idx].priceUgx = Number(e.target.value);
                        setTracks(copy);
                      }}
                      placeholder="Price in UGX"
                      className="w-full bg-ug-surface border border-ug-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-ug-gold font-mono"
                    />
                  </div>

                  <div className="text-xs text-emerald-400 font-bold shrink-0">
                    Earns: UGX {(track.priceUgx * 0.8).toLocaleString()} (80%)
                  </div>

                  {tracks.length > 3 && (
                    <button
                      type="button"
                      onClick={() => removeTrackRow(idx)}
                      className="p-2 text-ug-red hover:bg-ug-surface rounded-lg transition"
                      title="Remove track"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-ug-muted hover:text-white px-4 py-2"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (tracks.length < 3) {
                    setErrorMsg("You must provide at least 3 original MP3 tracks.");
                    return;
                  }
                  setErrorMsg("");
                  setCurrentStep(3);
                }}
                className="bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-8 py-3 rounded-full transition shadow-md"
              >
                Next: 10s MP4 & YouTube →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 10s MP4 Video & 3 YouTube Links */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-ug-red" />
                <span>Step 3: 10s Rotating MP4 Clip & 3 YouTube Videos</span>
              </h2>
              <p className="text-xs text-ug-muted mt-1">
                Your 10-second MP4 will cycle on the main page reel. You can replace it anytime.
              </p>
            </div>

            {/* 10s MP4 Video Input */}
            <div className="p-4 rounded-2xl bg-ug-card border border-ug-border">
              <label className="block text-xs font-semibold text-ug-gold mb-1">
                10-Second MP4 Video Highlight (Direct MP4 URL)
              </label>
              <input
                type="text"
                value={heroVideoMp4Url}
                onChange={(e) => setHeroVideoMp4Url(e.target.value)}
                placeholder="https://...mp4"
                className="w-full bg-ug-surface border border-ug-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-ug-gold font-mono"
              />
              <p className="text-[11px] text-ug-muted mt-1.5">
                Maximum 10 seconds duration. When you want to update it later, simply replace this video.
              </p>
            </div>

            {/* 3 YouTube Links */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-white">
                3 YouTube Music Video Links
              </label>
              {youtubeLinks.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-ug-muted w-6">#{i + 1}</span>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => {
                      const copy = [...youtubeLinks];
                      copy[i] = e.target.value;
                      setYoutubeLinks(copy);
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-ug-card border border-ug-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-ug-gold font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs text-ug-muted hover:text-white px-4 py-2"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-8 py-3 rounded-full transition shadow-md"
              >
                Next: Flyer & Freestyle →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Event Flyer & Freestyle */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-ug-gold" />
                <span>Step 4: Event Flyer & Freestyle Session</span>
              </h2>
              <p className="text-xs text-ug-muted mt-1">
                Advertise your next event and share raw cypher bars with your fans.
              </p>
            </div>

            {/* Event Flyer */}
            <div className="p-4 rounded-2xl bg-ug-card border border-ug-border space-y-3">
              <h3 className="text-xs font-bold text-ug-gold uppercase font-mono">
                Upcoming Show Flyer
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={flyer.title}
                  onChange={(e) => setFlyer({ ...flyer, title: e.target.value })}
                  placeholder="Show Title (e.g. Navio Live at Serena)"
                  className="w-full bg-ug-surface border border-ug-border rounded-xl px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  value={flyer.venue}
                  onChange={(e) => setFlyer({ ...flyer, venue: e.target.value })}
                  placeholder="Venue (e.g. Lugogo Cricket Oval)"
                  className="w-full bg-ug-surface border border-ug-border rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <input
                type="text"
                value={flyer.flyerImageUrl}
                onChange={(e) => setFlyer({ ...flyer, flyerImageUrl: e.target.value })}
                placeholder="Flyer Image URL"
                className="w-full bg-ug-surface border border-ug-border rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            {/* Freestyle */}
            <div className="p-4 rounded-2xl bg-ug-card border border-ug-border space-y-3">
              <h3 className="text-xs font-bold text-orange-400 uppercase font-mono">
                Freestyle / Cypher Session
              </h3>
              <input
                type="text"
                value={freestyle.title}
                onChange={(e) => setFreestyle({ ...freestyle, title: e.target.value })}
                placeholder="Session Title (e.g. Midnight Cypher 64 Bars)"
                className="w-full bg-ug-surface border border-ug-border rounded-xl px-3 py-2 text-xs text-white"
              />
              <input
                type="text"
                value={freestyle.mediaUrl}
                onChange={(e) => setFreestyle({ ...freestyle, mediaUrl: e.target.value })}
                placeholder="Audio/Video URL"
                className="w-full bg-ug-surface border border-ug-border rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs text-ug-muted hover:text-white px-4 py-2"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-8 py-3 rounded-full transition shadow-md"
              >
                Next: Function Rate Cards →
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Function Rate Cards & Final Submit */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-ug-gold" />
                <span>Step 5: Gigs & Function Pricing</span>
              </h2>
              <p className="text-xs text-ug-muted mt-1">
                Advertise your performance rates for weddings, parties, and club gigs.
              </p>
            </div>

            <div className="space-y-3">
              {services.map((srv, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-ug-card border border-ug-border flex flex-col md:flex-row items-center gap-4"
                >
                  <div className="flex-1 w-full md:w-auto">
                    <p className="font-bold text-sm text-white">{srv.serviceName}</p>
                    <p className="text-xs text-ug-muted mt-0.5">{srv.description}</p>
                  </div>

                  <div className="w-full md:w-44 flex items-center gap-2">
                    <span className="text-xs font-mono text-ug-gold font-bold">UGX</span>
                    <input
                      type="number"
                      value={srv.priceUgx}
                      onChange={(e) => {
                        const copy = [...services];
                        copy[idx].priceUgx = Number(e.target.value);
                        setServices(copy);
                      }}
                      className="w-full bg-ug-surface border border-ug-border rounded-xl px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-ug-gold/10 border border-ug-gold/40 text-xs text-ug-gold space-y-1">
              <p className="font-bold">HipHop-UG Direct Emcee Agreement:</p>
              <p className="text-gray-300">
                • 100% Free Registration forever.
                • 80% net credited directly to your Mobile Money wallet on every MP3 track sold.
                • 500MB total storage capacity included.
                • 10-second rotating hero clip showcased on the homepage.
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="text-xs text-ug-muted hover:text-white px-4 py-2"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleSubmitRegistration}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-sm uppercase px-8 py-3.5 rounded-full transition shadow-xl transform hover:scale-105 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Neon DB...</span>
                  </>
                ) : (
                  <span>Launch My Virtual Artist Zone</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
