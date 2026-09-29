"use client";

import React, { useState } from "react";
import { ArtistService } from "@/types";
import { Briefcase, CheckCircle, X, Loader2 } from "lucide-react";

interface ServiceBookingModalProps {
  services?: ArtistService[];
  artistId: string;
  stageName: string;
}

export function ServiceBookingModal({ services, artistId, stageName }: ServiceBookingModalProps) {
  const [selectedService, setSelectedService] = useState<ArtistService | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    eventDate: "",
    eventLocation: "",
    notes: "",
  });

  const handleOpenModal = (service: ArtistService) => {
    setSelectedService(service);
    setIsSuccess(false);
    setErrorMsg("");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          artistId,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          eventDate: formData.eventDate,
          eventLocation: formData.eventLocation,
          notes: formData.notes,
          quotedPriceUgx: selectedService.priceUgx,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to submit booking inquiry.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!services || services.length === 0) return null;

  return (
    <div className="bg-ug-surface rounded-3xl border border-ug-border p-6 md:p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-ug-border/80 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-ug-gold" />
            <h3 className="text-2xl font-black text-white">Book for Functions & Events</h3>
          </div>
          <p className="text-xs text-ug-muted mt-1">
            Hire {stageName} for weddings, kwanjula, private parties, club nights, and studio features
          </p>
        </div>

        <span className="text-xs font-mono uppercase bg-ug-card px-3.5 py-1.5 rounded-full border border-ug-border text-ug-gold font-bold">
          Verified Rate-Card
        </span>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="bg-ug-card rounded-2xl border border-ug-border p-6 flex flex-col justify-between hover:border-ug-gold transition-all duration-300 shadow-lg group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-ug-gold uppercase tracking-wider">
                  PACKAGE
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              <h4 className="text-lg font-black text-white group-hover:text-ug-gold transition">
                {service.serviceName}
              </h4>

              <p className="text-xs text-ug-muted mt-2 line-clamp-3 leading-relaxed">
                {service.description || "Professional performance tailored to your event schedule and audience."}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-ug-border/60">
              <div className="mb-4">
                <p className="text-[11px] text-ug-muted uppercase font-mono">Standard Rate</p>
                <p className="text-xl font-black text-ug-gold">
                  UGX {service.priceUgx.toLocaleString()}
                </p>
                {service.priceUsd && (
                  <p className="text-[10px] text-ug-muted font-mono">
                    Approx. ${service.priceUsd.toLocaleString()} USD
                  </p>
                )}
              </div>

              <button
                onClick={() => handleOpenModal(service)}
                className="w-full bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-xs uppercase py-3 rounded-xl transition shadow-md"
              >
                Inquire & Book Now
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Form Modal */}
      {isOpen && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-ug-surface border border-ug-border rounded-3xl p-6 md:p-8 shadow-2xl text-white">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-ug-muted hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h4 className="text-2xl font-black text-white">Booking Inquiry Sent!</h4>
                <p className="text-sm text-ug-muted mt-2 max-w-sm mx-auto">
                  Your inquiry for <strong className="text-white">{selectedService.serviceName}</strong> with {stageName} has been routed to management. You will receive an SMS/Call on {formData.clientPhone}.
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-6 bg-ug-gold text-black font-bold text-xs uppercase px-6 py-2.5 rounded-full"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h4 className="text-xl font-black text-white">Book {stageName}</h4>
                  <p className="text-xs text-ug-muted">
                    Service: {selectedService.serviceName} (UGX {selectedService.priceUgx.toLocaleString()})
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-ug-red/20 border border-ug-red text-red-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ug-muted mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full bg-ug-card border border-ug-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                    placeholder="e.g. Kato Brian"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ug-muted mb-1">
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      className="w-full bg-ug-card border border-ug-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                      placeholder="077... or 070..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ug-muted mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full bg-ug-card border border-ug-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                      placeholder="kato@gmail.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ug-muted mb-1">
                      Event Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.eventDate}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                      className="w-full bg-ug-card border border-ug-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ug-muted mb-1">
                      Location / Venue
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.eventLocation}
                      onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                      className="w-full bg-ug-card border border-ug-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                      placeholder="e.g. Speke Resort Munyonyo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ug-muted mb-1">
                    Event Details & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-ug-card border border-ug-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-ug-gold"
                    placeholder="Specific songs, entrance cues, or duration requirements..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-ug-gold hover:bg-yellow-400 text-black font-extrabold text-sm uppercase py-3.5 rounded-xl transition shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Inquiry...</span>
                    </>
                  ) : (
                    <span>Submit Function Booking Inquiry</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
