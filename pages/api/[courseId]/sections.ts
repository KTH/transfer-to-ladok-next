import type { NextApiRequest, NextApiResponse } from "next";
import { getCanvasClient } from "lib/canvasApi";
import { withSessionRoute } from "lib/withSession";

export default withSessionRoute(sectionsHandler);

async function sectionsHandler(req: NextApiRequest, res: NextApiResponse) {
  const canvas = await getCanvasClient(req);

  if (!canvas) {
    res.status(401).json({ message: "unauthorized" });
    return;
  }

  try {
    const sections = await canvas.getCanvasSections("1").toArray();
    console.log(sections);
  } catch (err) {
    console.error(err);
  }

  res.status(200).json({
    name: "Hello",
  });
}
