import Canvas from "@kth/canvas-api";

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
  }

  getCanvasSections(courseId: string) {
    return this.client.listItems<Section>(`courses/${courseId}/sections`);
  }

  getAssignments(courseId: string) {
    return this.client.listItems<Assignment>(`courses/${courseId}/assignments`);
  }

  getSubmissions(courseId: string, assignmentId: string) {
    return this.client.listItems<Submission>(
      `courses/${courseId}/assignments/${assignmentId}/submissions`
    );
  }

  getFinalGrades(courseId: string) {
    return this.client.listItems<Enrollment>(`courses/${courseId}/enrollments`);
  }
}
