/**
 * This module is the API Client used by the frontend to perform requests to
 * the backend side of the app
 */
import type { StudieResultat } from "pages/api/students";
import type { CanvasGrade } from "pages/api/courses/[...assignmentSubmissions]";

export async function fetchStudentsByAktivitetstillfalle(
  aktivitetstillfalle: string
): Promise<StudieResultat[]> {
  const response = await fetch(
    `/transfer-to-ladok/api/students?aktivitetstillfalle=${aktivitetstillfalle}`
  );

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
}

export async function fetchStudentsByUtbildningsinstans(
  utbildningsinstans: string,
  kurstillfalle: string
): Promise<StudieResultat[]> {
  const response = await fetch(
    `/transfer-to-ladok/api/students?utbildningsinstans=${utbildningsinstans}&kurstillfalle=${kurstillfalle}`
  );

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
}

export async function fetchCanvasGrades(
  courseId: string,
  assignmentId: string
): Promise<CanvasGrade[]> {
  const response = await fetch(
    `/transfer-to-ladok/api/courses/${courseId}/assignments/${assignmentId}/submissions`
  );

  if (!response.ok) {
    throw new Error("");
  }

  return response.json();
}
