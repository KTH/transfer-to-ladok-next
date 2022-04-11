import {
  getKurstillfalleInAktivitetstillfalle,
  getStudentsInAktivitetstillfalle,
  getStudentsInUtbilidningsinstans,
} from "lib/ladokApi";
import { NextApiRequest, NextApiResponse } from "next";

export interface StudieResultat {
  id: string;
  studieResultatUid: string;
}

type Params =
  | { type: "aktivitetstillfalle"; aktivitetstillfalle: string }
  | {
      type: "utbildningsinstans";
      utbildningsinstans: string;
      kurstillfalle: string;
    };

function getQueryParams(req: NextApiRequest): Params {
  const aktivitetstillfalle = req.query.aktivitetstillfalle;
  const kurstillfalle = req.query.kurstillfalle;
  const utbildningsinstans = req.query.utbildningsinstans;

  if (typeof aktivitetstillfalle === "string") {
    return {
      type: "aktivitetstillfalle",
      aktivitetstillfalle,
    };
  } else if (
    typeof kurstillfalle === "string" &&
    typeof utbildningsinstans === "string"
  ) {
    return {
      type: "utbildningsinstans",
      utbildningsinstans,
      kurstillfalle,
    };
  }

  throw new Error(
    `This endpoint require either [aktivitetstillfalle] or [kurstillfalle]+[utbildningsinstans] as query parameters`
  );
}

export default async function studentsHandler(
  req: NextApiRequest,
  res: NextApiResponse<StudieResultat[]>
) {
  const params = getQueryParams(req);
  // TODO: check if the session has permissions to get this information

  if (params.type === "aktivitetstillfalle") {
    const akt = params.aktivitetstillfalle;
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

    return;
  }

  if (params.type === "utbildningsinstans") {
    const utb = params.utbildningsinstans;
    const ktf = params.kurstillfalle;

    const students = await getStudentsInUtbilidningsinstans(utb, [ktf]);

    const normalized = students.Resultat.map((st) => ({
      id: st.Student.Uid,
      studieResultatUid: st.Uid,
    }));

    res.status(200).json(normalized);
    return;
  }

  throw new Error("Incorrect params!!!");
}
