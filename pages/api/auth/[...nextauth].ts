import NextAuth from "next-auth";
import clientPromise from "lib/mongo";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    {
      id: "canvas",
      name: "Canvas",
      type: "oauth",
      clientId: process.env.CANVAS_OAUTH_CLIENT_ID,
      clientSecret: process.env.CANVAS_OAUTH_CLIENT_SECRET,
      authorization: new URL(
        "/login/oauth2/auth",
        process.env.CANVAS_API_URL
      ).toString(),
      token: new URL(
        "/login/oauth2/token",
        process.env.CANVAS_API_URL
      ).toString(),
      userinfo: new URL(
        "/api/v1/users/self",
        process.env.CANVAS_API_URL
      ).toString(),

      profile(profile) {
        return {
          id: profile.id,
        };
      },
    },
  ],

  adapter: MongoDBAdapter(clientPromise),

  callbacks: {
    async session({ session, token, user }) {
      console.log(token);
      console.log(user);

      return session;
    },
  },
});
