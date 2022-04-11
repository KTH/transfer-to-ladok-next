import type { GetServerSideProps, NextPage } from "next";
import { withSessionSsr } from "lib/withSession";
import CanvasAPI from "lib/canvasApi";
import { CanvasApiError } from "@kth/canvas-api";
import { useRouter } from "next/router";
import { useQueryClient, useQuery } from "react-query";
import { StudieResultat } from "pages/api/aktivitetstillfalle/[aktId]/students";

// Endpoint /courses/:courseId/gradebook
// Query parameters. Must be one of them:
// ?aktivitetstillfalle  - Ladok UID for aktivitetstillfalle
// ?kurstillfalle        - Ladok UID for kurstillfalle

type Params =
  | { type: "aktivitetstillfalle"; aktivitetstillfalle: string }
  | { type: "kurstillfalle"; kurstillfalle: string };

/** Get the query parameters if correctly formated */
function useQueryParams(): Params {
  const router = useRouter();
  const aktivitetstillfalle = router.query.aktivitetstillfalle;
  const kurstillfalle = router.query.kurstillfalle;

  // It should be one or the other but not both
  if (aktivitetstillfalle && kurstillfalle) {
    throw new Error(
      `Given both query parameters [aktivitetstillfalle=${aktivitetstillfalle}] and [kurstillfalle=${kurstillfalle}]. Only one should be provided`
    );
  }

  if (aktivitetstillfalle) {
    if (typeof aktivitetstillfalle === "string") {
      return { type: "aktivitetstillfalle", aktivitetstillfalle };
    } else {
      throw new Error(
        `Query parameter [aktivitetstillfalle] should be a string. Given type [${typeof aktivitetstillfalle}]`
      );
    }
  } else if (kurstillfalle) {
    if (typeof kurstillfalle === "string") {
      return { type: "kurstillfalle", kurstillfalle };
    } else {
      throw new Error(
        `Query parameter [kurstillfalle] should be a string. Given type [${typeof kurstillfalle}]`
      );
    }
  }

  throw new Error(
    `Require either [aktivitetstillfalle] or [kurstillfalle] query parameters`
  );
}

function useStudents(params: Params) {
  return useQuery<StudieResultat[], Error>(["students"], async () => {
    if (params.type === "aktivitetstillfalle") {
      const response = await fetch(
        `/transfer-to-ladok/api/aktivitetstillfalle/${params.aktivitetstillfalle}/students`
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      return response.json();
    }
  });
}

interface GradebookProps {
  assignments: {
    id: number;
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
              id: a.id,
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
  const router = useRouter();
  const params = useQueryParams();
  const studentsQuery = useStudents(params);

  return (
    <div>
      <header>
        <h2>Choose an assignment</h2>
        <select name="" id="">
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
