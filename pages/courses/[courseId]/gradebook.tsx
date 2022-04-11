import type { GetServerSideProps, NextPage } from "next";
import { withSessionSsr } from "lib/withSession";
import CanvasAPI from "lib/canvasApi";
import { CanvasApiError } from "@kth/canvas-api";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import { useState } from "react";
import { StudieResultat } from "pages/api/students";

// Endpoint /courses/:courseId/gradebook

/**
 * This type formalizes the query parameters that can be passed to this
 * endpoint
 */
type Params =
  | { type: "aktivitetstillfalle"; aktivitetstillfalle: string }
  | {
      type: "utbildningsinstans";
      utbildningsinstans: string;
      kurstillfalle: string;
    };

/**
 * Get the query parameters if correctly formated
 */
function useQueryParams(): Params {
  const router = useRouter();
  const aktivitetstillfalle = router.query.aktivitetstillfalle;
  const kurstillfalle = router.query.kurstillfalle;
  const utbildningsinstans = router.query.utbildningsinstans;

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

async function fetchStudentsByAktivitetstillfalle(
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

async function fetchStudentsByUtbildningsinstans(
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

function useStudents(params: Params) {
  return useQuery(["students"], () => {
    if (params.type === "aktivitetstillfalle") {
      return fetchStudentsByAktivitetstillfalle(params.aktivitetstillfalle);
    }

    if (params.type === "utbildningsinstans") {
      return fetchStudentsByUtbildningsinstans(
        params.utbildningsinstans,
        params.kurstillfalle
      );
    }

    throw new Error("[params.type] should be aktivitetstillfalle");
  });
}
interface GradebookProps {
  assignments: {
    id: string;
    name: string;
    type: "letter_grade" | "gpa_scale" | "points";
  }[];
}

const _getServerSideProps: GetServerSideProps<GradebookProps> = async (
  context
) => {
  try {
    if (context.req.session) {
      const { accessToken } = context.req.session;

      if (accessToken) {
        const canvas = new CanvasAPI(accessToken);
        const assignments = await canvas
          .getAssignments(context.query.courseId as string)
          .toArray();

        return {
          props: {
            assignments: assignments.map((a) => ({
              id: a.id.toString(10),
              name: a.name,
              type: a.grading_type,
            })),
          },
        };
      }
    }
  } catch (err) {
    if (err instanceof CanvasApiError) {
      if (err.code !== 401) {
        throw err;
      }
    } else {
      console.error(err);
      throw err;
    }
  }

  return {
    redirect: {
      destination: `/unauthenticated?courseId=${context.query.courseId}`,
      permanent: false,
    },
  };
};

export const getServerSideProps = withSessionSsr<{}>(_getServerSideProps);

const Gradebook: NextPage<GradebookProps> = ({ assignments }) => {
  const params = useQueryParams();
  const studentsQuery = useStudents(params);
  const [assignmentId, setAssignmentId] = useState("0");

  return (
    <div>
      <header>
        <h2>Choose an assignment</h2>
        <select
          onChange={(e) => setAssignmentId(e.target.value)}
          value={assignmentId}
        >
          <option value={0}>Select</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} {a.type}
            </option>
          ))}
        </select>
        <h2>Choose an option for examination date</h2>
      </header>
      <main>Here you can see students!</main>
      {studentsQuery.isFetched ? "Available!" : "Loading!"}
    </div>
  );
};

export default Gradebook;
