export type UserRole = "FAN" | "ARTIST" | "ADMIN";
export type SubscriptionTier = "FREE" | "PRO";
export type MediaType = "AUDIO" | "VIDEO";
export type BookingStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
export type PurchaseStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  googleId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ArtistSocials {
  instagram?: string | null;
  x?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
  facebook?: string | null;
}

export interface Artist {
  id: string;
  userId: string;
  stageName: string;
  realName: string;
  dob: string;
  bio?: string | null;
  region: string; // Kampala, Jinja, Gulu, Mbarara, Mbale, etc.
  subgenre: string; // Luga Flow, Uga-Flow, Luo Rap, Drill, Boom-Bap
  socials: ArtistSocials;
  phoneForBookings?: string | null;
  bookingEmail?: string | null;
  websiteUrl?: string | null;
  portrait?: ArtistImage | null;
  photos?: ArtistImage[];
  heroVideoMp4Url?: string | null;
  heroVideoDurationSecs?: number;
  storageUsedBytes: number; // Max 500MB (524,288,000 bytes) for FREE
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Joined relations
  tracks?: Track[];
  youtubeVideos?: ArtistYouTubeVideo[];
  eventFlyers?: EventFlyer[];
  freestyles?: Freestyle[];
  services?: ArtistService[];
}

export interface ArtistImage {
  id: string; url: string; purpose: "portrait" | "gallery"; orderIndex: number;
  filesizeBytes: number; width: number; height: number; filename: string;
}

export interface Track {
  id: string;
  artistId: string;
  title: string;
  durationSeconds: number;
  fileUrl: string;
  previewUrl: string;
  playbackUrl?: string; // Authenticated owner-only full MP3 stream
  filesizeBytes: number;
  priceUgx: number;
  priceUsd: number;
  playCount: number;
  downloadCount: number;
  purchaseCount?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;

  // Joined relations
  artistStageName?: string;
  artistAvatarUrl?: string;
}

export interface ArtistYouTubeVideo {
  id: string;
  artistId: string;
  youtubeUrl: string;
  videoTitle?: string | null;
  orderIndex: number;
  createdAt: string;
  deletedAt?: string | null;
}

export interface EventFlyer {
  id: string;
  artistId: string;
  title: string;
  eventDate: string;
  venue: string;
  city: string;
  flyerImageUrl: string;
  ticketLink?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Freestyle {
  id: string;
  artistId: string;
  title: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ArtistService {
  id: string;
  artistId: string;
  serviceName: string;
  description?: string | null;
  priceUgx: number;
  priceUsd?: number | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  artistId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate: string;
  eventLocation: string;
  notes?: string | null;
  quotedPriceUgx: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Purchase {
  id: string;
  buyerId?: string | null;
  trackId: string;
  artistId: string;
  amountPaidUgx: number;
  platformCommissionUgx: number; // 20%
  artistEarningsUgx: number; // 80%
  paymentMethod: string; // 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD'
  paymentReference: string;
  status: PurchaseStatus;
  downloadToken: string;
  downloadExpiresAt: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistWallet {
  id: string;
  artistId: string;
  currentBalanceUgx: number;
  totalEarnedUgx: number;
  totalWithdrawnUgx: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  purchaseId?: string | null;
  amountUgx: number;
  type: "CREDIT_SALE" | "DEBIT_PAYOUT";
  balanceAfterUgx: number;
  description: string;
  createdAt: string;
}
