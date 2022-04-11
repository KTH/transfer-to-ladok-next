import { NextApiRequest, NextApiResponse } from "next";
import { Issuer, generators } from "openid-client";
import { URL } from "url";
import { withSessionRoute } from "lib/withSession";
import assert from "assert";

declare module "openid-client" {
  interface TokenSet {
    user: {
      id: number;
    };
  }
}

const OAUTH_REDIRECT_URI = new URL(
  "/transfer-to-ladok/api/auth/callback",
  process.env.SERVER_HOST_URL
);

const issuer = new Issuer({
  issuer: "se.kth",
  authorization_endpoint: new URL(
    "/login/oauth2/auth",
    process.env.CANVAS_API_URL
  ).toString(),
  token_endpoint: new URL(
    "/login/oauth2/token",
    process.env.CANVAS_API_URL
  ).toString(),
});
const client = new issuer.Client({
  client_id: process.env.CANVAS_DEVELOPER_KEY_ID,
  client_secret: process.env.CANVAS_DEVELOPER_KEY_SECRET,
  redirect_uris: [OAUTH_REDIRECT_URI.toString()],
});

export default withSessionRoute(oauthHandler);

async function oauthHandler(req: NextApiRequest, res: NextApiResponse) {
  // Handle these two routes:
  // - POST /
  // - GET  /callback
  if (req.method === "GET" && !req.query.slug) {
    const state = generators.state();
    const url = client.authorizationUrl({ state });

    req.session.temporalReturnUrl = req.query.returnUrl as string;
    req.session.temporalState = state;
    await req.session.save();

    res.redirect(url);
  } else if (req.method === "GET" && req.query.slug?.[0] === "callback") {
    const tokenSet = await client.oauthCallback(
      OAUTH_REDIRECT_URI.toString(),
      req.query,
      {
        state: req.session.temporalState,
      }
    );

    assert(tokenSet.access_token, "No access token!?");
    assert(tokenSet.refresh_token, "No refresh token!?");

    const returnUrl = req.session.temporalReturnUrl;

    req.session.temporalState = "";
    req.session.temporalReturnUrl = "";
    req.session.userId = tokenSet.user.id;
    req.session.accessToken = tokenSet.access_token;
    req.session.refreshToken = tokenSet.refresh_token;
    await req.session.save();

    res.redirect(`/transfer-to-ladok/${returnUrl}`);
  }
}
