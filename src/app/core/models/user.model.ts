export interface User {
  name?: string;
  job?: string;
  picture?: string;
  country_id?: number;
  dateBegin?: string;
  dateEnd?: string;
  email?: string;
  farmIdPrefered?: number;
  fullName?: string;
  identificationNumber?: string;
  keylogin?: string;
  land?: string;
  peronalId?: number;
  status?: string;
  token?: string;
  user?: string;
  userId?: number;
  roles?: string[];
  rol?: string;
}

// Interface para usar en componentes
export interface UserPhotoData {
  photoUrl: string;
  isDefault: boolean;
  lastUpdated?: Date;
}

export interface UserPhotoConfig {
  defaultPhotoUrl?: string;
  cacheEnabled?: boolean;
  cacheDurationMs?: number;
}

export interface PhotoCache {
  photoUrl: string;
  timestamp: number;
}
