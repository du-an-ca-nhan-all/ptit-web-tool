export interface SlinkAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type?: string;
  scope?: string;
  [key: string]: any;
}

export interface SlinkUserInfo {
  sub?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  [key: string]: any;
}

export interface SlinkNotificationItem {
  id?: string | number;
  title: string;
  content?: string;
  createdAt?: string;
  read?: boolean;
  sender?: string;
  senderName?: string;
  type?: string;
  [key: string]: any;
}

export interface SlinkNotificationResponse {
  success: boolean;
  data?: {
    page: number;
    skip: number;
    limit: number;
    total: number;
    unread: number;
    result: SlinkNotificationItem[];
  };
  message?: string;
}

export interface SlinkLoginResult {
  token: string; // Bearer access_token
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn: number;
  username: string;
}

export interface SlinkJwtPayload {
  azp?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  sub?: string;
  preferred_username?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}
