/**
 * This module is the API Client used by the frontend to perform requests to
 * the backend side of the app
 */
import type { StudieResultat } from "pages/api/students";
import type { Submissions } from "pages/api/courses/[...assignmentSubmissions]";

async function fetchApi(endpoint: string) {
  const response = await fetch(`/transfer-to-ladok/api/${endpoint}`);

  if (!response.ok) {
    // TODO. Better error handling
    throw new Error("Network response was not OK");
  }

  return response.json();
}

export async function fetchStudentsByAktivitetstillfalle(
  aktivitetstillfalle: string
): Promise<StudieResultat[]> {
  return fetchApi(`students?aktivitetstillfalle=${aktivitetstillfalle}`);
}

export async function fetchStudentsByUtbildningsinstans(
  utbildningsinstans: string,
  kurstillfalle: string
): Promise<StudieResultat[]> {
  return fetchApi(
    `students?utbildningsinstans=${utbildningsinstans}&kurstillfalle=${kurstillfalle}`
  );
}

export async function fetchCanvasGrades(
  courseId: string,
  assignmentId: string,
  page: number
): Promise<Submissions> {
  return fetchApi(
    `courses/${courseId}/assignments/${assignmentId}/submissions?page=${page}`
  );
}
