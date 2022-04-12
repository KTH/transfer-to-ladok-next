import type { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "lib/withSession";
import { getCanvasClient, redirectUnauthenticated } from "lib/canvasApi";

export default withSessionRoute(sectionsHandler);

export interface CanvasGrade {
  id: string;
  grade: string;
  submissionDate: string;
}

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

  const page = parseInt(
    typeof req.query.page === "string" ? req.query.page : ""
  );

  return {
    courseId,
    assignmentId,
    page: isNaN(page) ? 1 : page,
  };
}

async function sectionsHandler(req: NextApiRequest, res: NextApiResponse) {
  // Only handle /api/courses/:courseId/assignments/:assignmentId/submissions
  const params = getPathParams(req);

  if (!params) {
    res.status(404).json({});
    return;
  }

  const canvas = await getCanvasClient(req);

  if (!canvas) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }

  const submissions = await canvas.getSubmissions(
    params.courseId,
    params.assignmentId,
    params.page
  );

  res.status(200).json(
    submissions.map((s) => ({
      id: s.user.integration_id,
      grade: s.grade,
      submissionDate: s.submitted_at,
    }))
  );
  return;
}
