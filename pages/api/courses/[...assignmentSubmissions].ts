import type { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "lib/withSession";
import { getCanvasClient } from "lib/canvasApi";

export default withSessionRoute(sectionsHandler);

function getPathParams(req: NextApiRequest) {
  const [courseId, w1, assignmentId, w2] = req.query
    .assignmentSubmissions as string[];

  if (w1 !== "assignments" || w2 !== "submissions") {
    return null;
  }

  if (typeof courseId !== "string" || typeof assignmentId !== "string") {
    return null;
  }

  if (req.method !== "GET") {
    return null;
  }

  return {
    courseId,
    assignmentId,
  };
}

async function sectionsHandler(req: NextApiRequest, res: NextApiResponse) {
  // Only handle /api/courses/:courseId/assignments/:assignmentId/submissions
  const params = getPathParams(req);

  if (!params) {
    return res.status(404).json({});
  }

  const canvas = await getCanvasClient(req);

  res.status(200).json({
    message: "Hello",
  });
}
