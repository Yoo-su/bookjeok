import "next-auth";

declare module "next-auth" {
  interface Session {
    provider?: string;
    providerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
    providerId?: string;
  }
}
