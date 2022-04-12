import type { NextApiRequest, NextApiResponse } from "next";
import { withSessionRoute } from "lib/withSession";
import { getCanvasClient } from "lib/canvasApi";

export default withSessionRoute(sectionsHandler);

export interface Submissions {
  summary: {
    total: number;
  };
  submissions: {
    id: string;
    grade: string | null;
    submissionDate: string | null;
  }[];
}
export interface ErrorMessage {
  message: string;
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
    page: isNaN(page) || page < 1 ? 1 : page,
  };
}

async function sectionsHandler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorMessage | Submissions>
) {
  // Only handle /api/courses/:courseId/assignments/:assignmentId/submissions
  const params = getPathParams(req);

  if (!params) {
    res.status(404).json({ message: "not found" });
    return;
  }

  const canvas = await getCanvasClient(req);

  if (!canvas) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }

  const summary = await canvas.getSubmissionsSummary(
    params.courseId,
    params.assignmentId
  );
  const submissions = await canvas.getSubmissions(
    params.courseId,
    params.assignmentId,
    params.page
  );

  res.status(200).json({
    summary: {
      total: summary.graded + summary.not_submitted + summary.ungraded,
    },
    submissions: submissions
      .filter((s) => s.user.sortable_name !== "Teststudent")
      .map((s) => ({
        id: s.user.integration_id,
        grade: s.grade,
        submissionDate: s.submitted_at,
      })),
  });
  return;
}
