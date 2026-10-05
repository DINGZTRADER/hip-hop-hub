"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Mp3Upload } from "@/components/audio/Mp3Upload";
import { ArtistProfileManager } from "@/components/artist/ArtistProfileManager";
import { storageQuotaBytes } from "@/lib/artist-media-policy";
import { MAX_ARTIST_TRACKS } from "@/lib/artist-track-policy";
import {
  Wallet,
  Music,
  Video,
  Calendar,
  CheckCircle2,
  Phone,
  ExternalLink,
  Loader2,
  Plus,
  AlertCircle,
  Clock,
  MapPin,
  DollarSign,
  ArrowDownLeft,
} from "lucide-react";
import { Artist, ArtistWallet, ServiceBooking, WalletTransaction } from "@/types";

export default function ArtistDashboardPage() {
  const [artist, setArtist] = useState<Artist | null>(null);
  const [wallet, setWallet] = useState<ArtistWallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 10s MP4 Video replacement state
  const [newMp4Url, setNewMp4Url] = useState<string>("");
  const [isUpdatingVideo, setIsUpdatingVideo] = useState<boolean>(false);
  const [videoSuccess, setVideoSuccess] = useState<boolean>(false);

  const [originalsConfirmed,setOriginalsConfirmed]=useState(false);
  const [isUploadingMp3, setIsUploadingMp3] = useState(false);

  // Add new track modal state
  const [showAddTrackModal, setShowAddTrackModal] = useState<boolean>(false);
  const [isAddingTrack, setIsAddingTrack] = useState<boolean>(false);
  const [addTrackError, setAddTrackError] = useState<string>("");
  const [addTrackSuccess, setAddTrackSuccess] = useState<string>("");
  const [newTrackForm, setNewTrackForm] = useState({
    title: "",
    durationSeconds: 210,
    priceUgx: 3000,
    fileUrl: "",
    masterUploadId: "",
    masterName: "",
    filesizeBytes: 0,
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.authenticated) {
          const stageName = data.user.stageName || "Navio";

          // Fetch artist profile
          const aRes = await fetch(`/api/artists/${encodeURIComponent(stageName)}`);
          const aData = await aRes.json();
          if (aData.artist) {
            setArtist(aData.artist);
            setNewMp4Url(aData.artist.heroVideoMp4Url || "");

            // Fetch wallet and transactions
            const wRes = await fetch(`/api/wallet?artistId=${aData.artist.id}`);
            const wData = await wRes.json();
            if (wData.wallet) {
              setWallet(wData.wallet);
              setTransactions(wData.transactions || []);
            }

            // Fetch bookings
            const bRes = await fetch(`/api/bookings?artistId=${aData.artist.id}`);
            const bData = await bRes.json();
            if (bData.bookings) {
              setBookings(bData.bookings);
            }
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdateMp4 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist || !newMp4Url) return;

    setIsUpdatingVideo(true);
    setVideoSuccess(false);

    try {
      const res = await fetch(`/api/artists/${encodeURIComponent(artist.stageName)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroVideoMp4Url: newMp4Url }),
      });

      if (res.ok) {
        setVideoSuccess(true);
        setArtist({ ...artist, heroVideoMp4Url: newMp4Url });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingVideo(false);
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist || isUploadingMp3) return;
    if ((artist.tracks?.length ?? 0) >= MAX_ARTIST_TRACKS) {
      setAddTrackError("Up to 10 original MP3 tracks are allowed."); return;
    }
    if (!newTrackForm.fileUrl || !newTrackForm.masterUploadId) {
      setAddTrackError("Upload your full MP3 first."); return;
    }

    if(!originalsConfirmed){setAddTrackError("Confirm this is your original music.");return;}
    setIsAddingTrack(true);
    setAddTrackError("");
    setAddTrackSuccess("");

    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: artist.id,
          ...newTrackForm, originalsConfirmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to upload track.");
      }

      setAddTrackSuccess(`"${data.track.title}" added to your crate!`);
      const updatedTracks = [...(artist.tracks || []), data.track];
      setArtist({
        ...artist,
        tracks: updatedTracks,
        storageUsedBytes: artist.storageUsedBytes + newTrackForm.filesizeBytes,
      });

      setTimeout(() => {
        setShowAddTrackModal(false);
        setAddTrackSuccess("");
      }, 1500);
    } catch (err: any) {
      setAddTrackError(err.message || "Failed to upload track.");
    } finally {
      setIsAddingTrack(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ug-gold animate-spin" />
      </div>
    );
  }

  const currentArtist = artist;
  const storageMB = currentArtist ? (currentArtist.storageUsedBytes / (1024 * 1024)).toFixed(1) : "0";
  const storagePct = Math.min(
    100,
    currentArtist ? (currentArtist.storageUsedBytes / storageQuotaBytes(currentArtist.subscriptionTier)) * 100 : 0
  );

  return (
    <div className="min-h-screen py-10 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-ug-border gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs uppercase font-mono font-bold text-ug-gold tracking-widest">
              EMCEE COMMAND CENTER
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white">
            {currentArtist ? `${currentArtist.stageName}'s Hub` : "Artist Dashboard"}
          </h1>
          <p className="text-xs text-ug-muted mt-1">
            Manage your 10s hero reel, track sales, Mobile Money wallet, and live event bookings
          </p>
        </div>

        {currentArtist && (
          <Link
            href={`/artist/${encodeURIComponent(currentArtist.stageName)}`}
            className="flex items-center gap-2 bg-ug-card hover:bg-ug-border text-white text-xs font-bold px-5 py-2.5 rounded-full border border-ug-border transition shadow"
          >
            <span>View Public Artist Zone</span>
            <ExternalLink className="w-3.5 h-3.5 text-ug-gold" />
          </Link>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-br from-ug-surface to-[#161d2a] p-6 rounded-3xl border border-ug-border shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold text-ug-gold uppercase">
              EARNINGS WALLET (80% NET)
            </span>
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <p className="text-3xl font-black text-white">
            UGX {wallet ? wallet.currentBalanceUgx.toLocaleString() : "Unavailable"}
          </p>
          <p className="text-xs text-ug-muted mt-1">
            Total Earned: UGX {wallet ? wallet.totalEarnedUgx.toLocaleString() : "Unavailable"}
          </p>

<p className="mt-5 text-xs text-ug-muted">Payout requests are currently unavailable.</p>
        </div>

        {/* 500MB Storage Quota Card */}
        <div className="bg-ug-surface p-6 rounded-3xl border border-ug-border shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-ug-muted uppercase">
                STORAGE QUOTA ({currentArtist ? storageQuotaBytes(currentArtist.subscriptionTier)/1048576 : 500} MB LIMIT)
              </span>
              <span className="text-xs font-bold text-ug-gold">{storagePct.toFixed(0)}%</span>
            </div>

            <p className="text-2xl font-black text-white">{storageMB} MB / {currentArtist ? storageQuotaBytes(currentArtist.subscriptionTier)/1048576 : 500} MB</p>

            <div className="w-full h-2 bg-ug-card rounded-full mt-3 overflow-hidden border border-ug-border">
              <div
                className="h-full bg-ug-gold rounded-full transition-all"
                style={{ width: `${storagePct}%` }}
              />
            </div>
            <p className="text-[11px] text-ug-muted mt-2">
              Free tier includes 500MB. Upgrade to UG Cypher Pro for 5GB.
            </p>
          </div>

          <Link
            href="/pricing"
            className="mt-4 text-center text-xs font-bold text-ug-gold hover:underline"
          >
            Upgrade to Pro (5GB) →
          </Link>
        </div>

        {/* Catalog Summary */}
        <div className="bg-ug-surface p-6 rounded-3xl border border-ug-border shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-ug-muted uppercase">
              CATALOG OVERVIEW
            </span>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-2xl font-black text-white">
                  {currentArtist?.tracks?.length || 0}
                </p>
                <p className="text-[11px] text-ug-muted">MP3 Track (Limit 1)</p>
              </div>
              <div>
                <p className="text-2xl font-black text-ug-red">
                  {currentArtist?.heroVideoMp4Url ? "1 Active" : "None"}
                </p>
                <p className="text-[11px] text-ug-muted">10s Hero Reel</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-ug-border/60 flex items-center justify-between text-xs">
            <span className="text-ug-muted">Platform Fee:</span>
            <span className="font-bold text-emerald-400">20% only on sales</span>
          </div>
        </div>
      </div>

      {/* 10s MP4 Hero Video Replacement Section */}
      <section className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 mb-8 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Video className="w-5 h-5 text-ug-red" />
          <h2 className="text-xl font-black text-white">
            10-Second Rotating Hero Video Clip
          </h2>
        </div>
        <p className="text-xs text-ug-muted max-w-2xl mb-6">
          Specification: Emcees can update their rotating 10s MP4 clip anytime by replacing the video link below. It immediately reflects on the homepage reel.
        </p>

        <form onSubmit={handleUpdateMp4} className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            required
            value={newMp4Url}
            onChange={(e) => setNewMp4Url(e.target.value)}
            placeholder="Direct MP4 URL (e.g. https://.../highlight.mp4)"
            className="flex-1 bg-ug-card border border-ug-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-ug-gold font-mono"
          />

          <button
            type="submit"
            disabled={isUpdatingVideo}
            className="flex items-center justify-center gap-2 bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-6 py-3 rounded-xl transition shadow-md disabled:opacity-50"
          >
            {isUpdatingVideo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating Reel...</span>
              </>
            ) : (
              <span>Replace 10s MP4</span>
            )}
          </button>
        </form>

        {videoSuccess && (
          <p className="text-xs text-emerald-400 font-bold mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            10-Second Hero Reel successfully updated! Now live on the homepage rotation.
          </p>
        )}
      </section>

      {currentArtist && <ArtistProfileManager artist={currentArtist} onSaved={setArtist}/>}
      {/* Tracks Management Table */}
      <section className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 shadow-xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-ug-border gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-ug-gold" />
              <h2 className="text-xl font-black text-white">Your MP3 Master Tracks</h2>
            </div>
            <p className="text-xs text-ug-muted mt-1">Up to 10 original MP3 tracks. No short preview required.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddTrackModal(true)}
            disabled={!currentArtist || (currentArtist.tracks?.length ?? 0) >= MAX_ARTIST_TRACKS}
            className="flex items-center gap-1.5 bg-ug-card hover:bg-ug-border text-ug-gold border border-ug-border text-xs font-bold px-4 py-2.5 rounded-full transition shadow disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Upload MP3 Track</span>
          </button>
        </div>

        <div className="divide-y divide-ug-border/60 mt-4">
          {(currentArtist?.tracks || []).map((t, idx) => (
            <div key={t.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-ug-muted">#{idx + 1}</span>
                <div>
                  <p className="font-bold text-white text-sm">{t.title}</p>
                  <p className="text-ug-muted mt-0.5">
                    {t.playCount.toLocaleString()} plays • {t.downloadCount.toLocaleString()} downloads •{" "}
                    {(t.filesizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-black text-ug-gold text-sm">
                  UGX {t.priceUgx.toLocaleString()}
                </span>
                <span className="text-emerald-400 font-bold">
                  UGX {(t.priceUgx * 0.8).toLocaleString()} net (80%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Booking Inquiries Received */}
      <section className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 shadow-xl mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-ug-gold" />
          <h2 className="text-xl font-black text-white">Live Gig & Function Bookings</h2>
        </div>
        <p className="text-xs text-ug-muted mb-6">
          Inquiries for weddings, club gigs, and guest verse collaborations submitted through your artist zone
        </p>

        {bookings.length === 0 ? (
          <div className="text-center py-8 bg-ug-card rounded-2xl border border-ug-border">
            <Calendar className="w-8 h-8 text-ug-muted mx-auto mb-2" />
            <p className="text-xs text-ug-muted">No pending bookings at the moment. Share your artist profile to get booked!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="p-4 bg-ug-card rounded-2xl border border-ug-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{b.clientName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-ug-gold/20 text-ug-gold border border-ug-gold/30">
                      {b.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-ug-muted mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-ug-gold" />
                      {new Date(b.eventDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-ug-red" />
                      {b.eventLocation}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      {b.clientPhone}
                    </span>
                  </div>
                  {b.notes && (
                    <p className="text-xs text-gray-300 mt-2 bg-ug-surface/80 p-2.5 rounded-xl border border-ug-border">
                      &quot;{b.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-ug-muted">Quoted Price</p>
                  <p className="text-lg font-black text-ug-gold">
                    UGX {b.quotedPriceUgx.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Wallet Transactions Ledger */}
      {transactions.length > 0 && (
        <section className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-black text-white">Immutable Wallet Ledger</h2>
          </div>
          <p className="text-xs text-ug-muted mb-4">
            ACID transaction log recording every 80% mobile money credit
          </p>

          <div className="divide-y divide-ug-border/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-white font-semibold">{tx.description}</p>
                    <p className="text-ug-muted text-[11px] mt-0.5">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-black">+UGX {tx.amountUgx.toLocaleString()}</p>
                  <p className="text-ug-muted text-[10px]">
                    Bal: UGX {tx.balanceAfterUgx.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upload Track Modal */}
      {showAddTrackModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-ug-surface border border-ug-border rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-ug-border">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-ug-gold" />
                <h3 className="text-lg font-black text-white">Upload MP3 Track</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTrackModal(false)}
                disabled={isUploadingMp3 || isAddingTrack}
                className="text-ug-muted hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {addTrackError && (
              <div className="mb-4 p-3 rounded-xl bg-ug-red/20 border border-ug-red text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-ug-red" />
                <span>{addTrackError}</span>
              </div>
            )}

            {addTrackSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{addTrackSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTrack} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ug-muted mb-1">
                  Track Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTrackForm.title}
                  onChange={(e) => setNewTrackForm({ ...newTrackForm, title: e.target.value })}
                  placeholder="e.g. Kampala Night Cypher ft. Keko"
                  className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-ug-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ug-muted mb-1">
                    Price (UGX) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    step={500}
                    value={newTrackForm.priceUgx}
                    onChange={(e) =>
                      setNewTrackForm({ ...newTrackForm, priceUgx: Number(e.target.value) })
                    }
                    className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-ug-gold font-mono"
                  />
                  <p className="text-[10px] text-emerald-400 mt-1">
                    You keep: UGX {(newTrackForm.priceUgx * 0.8).toLocaleString()} (80%)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ug-muted mb-1">
                    Duration (Secs)
                  </label>
                  <input
                    type="number"
                    required
                    value={newTrackForm.durationSeconds}
                    onChange={(e) =>
                      setNewTrackForm({ ...newTrackForm, durationSeconds: Number(e.target.value) })
                    }
                    className="w-full bg-ug-card border border-ug-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-ug-gold font-mono"
                  />
                </div>
              </div>

              <Mp3Upload value={newTrackForm} onBusyChange={setIsUploadingMp3} onError={setAddTrackError}
                onUploaded={uploaded => setNewTrackForm(previous => ({...previous, ...uploaded}))} />
              <p className="text-xs text-ug-muted">Upload one original full MP3. No short preview is required.</p>

              <label className="flex gap-2 text-xs text-ug-muted"><input type="checkbox" checked={originalsConfirmed} onChange={e=>setOriginalsConfirmed(e.target.checked)}/>I confirm this track is my original music.</label>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTrackModal(false)}
                disabled={isUploadingMp3 || isAddingTrack}
                  className="px-4 py-2.5 rounded-xl border border-ug-border text-ug-muted text-xs font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingTrack || isUploadingMp3 || !newTrackForm.fileUrl}
                  className="bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase px-6 py-2.5 rounded-xl transition shadow disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingTrack ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Track...</span>
                    </>
                  ) : (
                    <span>Add to Crate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
