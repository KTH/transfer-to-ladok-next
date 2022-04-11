import type { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "lib/withSession";

export default withSessionRoute(sectionsHandler);

async function sectionsHandler(req: NextApiRequest, res: NextApiResponse) {
  // Only handle /api/courses/:courseId/assignments/:assignmentId/submissions
  const [courseId, w1, assignmentId, w2] = req.query
    .assignmentSubmissions as string[];

  if (w1 !== "assignments" || w2 !== "submissions") {
    res.status(404).json({});
    return;
  }

  if (typeof courseId !== "string" || typeof assignmentId !== "string") {
    res.status(404).json({});
    return;
  }

  res.status(200).json({
    message: "Hello",
  });
}
