import type { GeoPoint, Timestamp } from "firebase/firestore";

export type UserRole = "Industrialist" | "Recycler" | "Transporter";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  plantName?: string; // For Recyclers: the name of their facility
  role: UserRole;
  location?: string; // Manual location: city, area, or postal code
  materials?: string[]; // For Recyclers: materials they accept
}

export interface WasteRequest {
  id: string;
  industrialistId: string;
  industrialistName: string;
  industrialistLocation: string;
  type: string;
  quantity: number; // in kg
  imageUrl?: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'in-transit' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  acceptedByRecyclerId?: string;
  recyclerName?: string;
  transportedById?: string;
}

export interface RecycledMaterial {
  id: string;
  recyclerId: string;
  type: string;
  quantity: number; // in kg
  price: number; // per kg
  imageUrl?: string;
  createdAt: Timestamp;
}

export interface TransportJob {
  id: string;
  wasteRequestId: string;
  transporterId: string;
  status: 'pending' | 'accepted' | 'picked-up' | 'delivered';
  pickupLocation: GeoPoint;
  dropoffLocation: GeoPoint;
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string; // The user who should receive the notification
  message: string;
  read: boolean;
  createdAt: Timestamp;
  link?: string; // Optional link to navigate to
}
