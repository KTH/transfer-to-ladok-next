import {
  getKurstillfalleInAktivitetstillfalle,
  getStudentsInAktivitetstillfalle,
} from "lib/ladokApi";
import { withSessionRoute } from "lib/withSession";
import { NextApiRequest, NextApiResponse } from "next";
import { useQuery } from "react-query";

export interface StudieResultat {
  id: string;
  stduieResultatUid: string;
}

export default async function studentsHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // TODO: check if the session has permissions to get this information
  const akt = req.query.aktId as string;
  const ktf = await getKurstillfalleInAktivitetstillfalle(akt);

  // TODO: Must this be paginated??
  const students = await getStudentsInAktivitetstillfalle(
    akt,
    ktf.Utbildningstillfalle.map((u) => u.Uid)
  );

  // Normalize Students
  const normalized = students.Resultat.map((st) => ({
    id: st.Student.Uid,
    studieResultatUid: st.Uid,
  }));
  res.status(200).json(normalized);
}

export async function fetchStudentsByAktivitetstillfalle(
  aktivitetstillfalleUID: string
) {
  const response = await fetch(
    `/transfer-to-ladok/api/aktivitetstillfalle/${aktivitetstillfalleUID}/students`
  );

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  return response.json();
}

export function useStudentsByAktivitetstillfalle(
  aktivitetstillfalleUID: string
) {
  return useQuery<StudieResultat[]>(["students"], () =>
    fetchStudentsByAktivitetstillfalle(aktivitetstillfalleUID)
  );
}
