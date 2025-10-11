export type GroupJoinStatus = "not_requested" | "pending" | "approved" | "rejected";

export type GroupRole = "admin" | "co-admin" | "member" | "none";

export interface GroupLocation {
  city?: string;
  region?: string;
  country?: string;
}

export interface GroupChat {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  banner?: string;
  memberCount: number;
  createdAt: string; // ISO date string
  lastActiveAt?: string; // ISO date string
  monthlyActivityScore?: number;
  tags?: string[]; // genres
  location?: GroupLocation;
  ownerId?: string;
  role?: GroupRole;
  isPrivate?: boolean;
  joinStatus?: GroupJoinStatus;
  rules?: string[]; // short rules for preview
}


