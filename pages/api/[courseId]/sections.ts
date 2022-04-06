import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import CanvasAPI from "lib/canvasApi";
import { getSession } from "next-auth/react";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getSession({ req });
  console.log(JSON.stringify(token));

  if (!token?.sub) {
    res.status(401).json({ message: "unauthorized" });
    return;
  }

  res.status(200).json({
    name: "Hello",
  });
}
