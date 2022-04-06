import NextAuth from "next-auth";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    {
      id: "canvas",
      name: "Canvas",
      type: "oauth",
      clientId: "87790000000000188",
      clientSecret:
        "QHC0Y4js8GNwJZ7aixDbuIvGZwxX1T9eK6YpFotMzHFKj8NypDpnveDI44OkNYjw",
      authorization: "https://kth.test.instructure.com/login/oauth2/auth",
      token: "https://kth.test.instructure.com/login/oauth2/token",
      userinfo: "https://kth.test.instructure.com/api/v1/users/self",
      profile(profile) {
        return {
          id: profile.id,
        };
      },
    },
  ],
});
