import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      try {
        const res = await fetch(`${BACKEND_URL}/api/profile/upsert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oauthProvider: account.provider,
            oauthId: account.providerAccountId,
            email: user.email,
            name: user.name,
            avatarUrl: user.image,
          }),
        });

        if (!res.ok) {
          const body = await res.text();
          console.error('[auth] profile upsert failed:', res.status, body);
          return false;
        }

        const profile = await res.json() as { id: string };
        console.log('[auth] profile upserted:', profile.id);
        (user as Record<string, unknown>).profileId = profile.id;
        return true;
      } catch (err) {
        console.error('[auth] signIn callback error:', err);
        return false;
      }
    },

    async jwt({ token, user }) {
      // On first sign-in, user object is populated
      if (user && (user as Record<string, unknown>).profileId) {
        token.profileId = (user as Record<string, unknown>).profileId as string;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.profileId) {
        session.user.profileId = token.profileId as string;
      }
      return session;
    },
  },
});
