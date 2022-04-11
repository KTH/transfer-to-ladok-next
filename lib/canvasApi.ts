import Canvas, { CanvasApiError, minimalErrorHandler } from "@kth/canvas-api";
import { IronSession } from "iron-session";
import { GetServerSidePropsContext, NextApiRequest } from "next";

export interface Section {
  sis_section_id: string;
  integration_id: string;
  name: string;
}

export interface Assignment {
  id: number;
  name: string;
  grading_type: "gpa_scale" | "points" | "letter_grade";
  grading_standard_id: number | null;
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
}

export interface Submission {
  id: number;
  grade: string | null;
  score: number | null;
  graded_at: string | null;
  submitted_at: string | null;
  user: {
    sortable_name: string;
    integration_id: string;
  };
}

export interface Enrollment {
  grades: {
    unposted_current_grade: string;
  };
  user: {
    integration_id: string;
  };
}

export default class CanvasAPI {
  client: Canvas;

  constructor(token: string) {
    this.client = new Canvas(process.env.CANVAS_API_URL, token);
    this.client.errorHandler = minimalErrorHandler;
  }

  getSelf() {
    return this.client.get("users/self");
  }

  getCanvasSections(courseId: string) {
    return this.client
      .listItems<Section>(`courses/${courseId}/sections`)
      .toArray();
  }

  getAssignments(courseId: string) {
    return this.client.listItems<Assignment>(`courses/${courseId}/assignments`);
  }

  getSubmissions(courseId: string, assignmentId: string) {
    return this.client.listItems<Submission>(
      `courses/${courseId}/assignments/${assignmentId}/submissions`,
      { include: "user" }
    );
  }

  getFinalGrades(courseId: string) {
    return this.client.listItems<Enrollment>(`courses/${courseId}/enrollments`);
  }
}

export async function getCanvasClient(req: { session: IronSession }) {
  if (!req.session) {
    return null;
  }

  const { accessToken } = req.session;

  if (!accessToken) {
    return null;
  }

  const canvas = new CanvasAPI(accessToken);

  try {
    await canvas.getSelf();

    return canvas;
  } catch (err) {
    if (err instanceof CanvasApiError && err.code === 401) {
      return null;
    }

    throw err;
  }
}

export function redirectUnauthenticated(context: GetServerSidePropsContext) {
  return {
    redirect: {
      destination: `/unauthenticated?returnUrl=${encodeURIComponent(
        context.resolvedUrl
      )}`,
      permanent: false,
    },
  };
}
