import type { GetServerSideProps, NextPage } from "next";
import { withSessionSsr } from "lib/withSession";
import CanvasAPI, {
  getCanvasClient,
  redirectUnauthenticated,
} from "lib/canvasApi";
import { useRouter } from "next/router";
import { useInfiniteQuery, useQuery } from "react-query";
import { useEffect, useState } from "react";
import {
  fetchCanvasGrades,
  fetchStudentsByAktivitetstillfalle,
  fetchStudentsByUtbildningsinstans,
} from "lib/apiClient";

// Endpoint /courses/:courseId/gradebook

/**
 * This type formalizes the query parameters that can be passed to this
 * endpoint
 */
type Params =
  | {
      type: "aktivitetstillfalle";
      aktivitetstillfalle: string;
      courseId: string;
    }
  | {
      type: "utbildningsinstans";
      utbildningsinstans: string;
      kurstillfalle: string;
      courseId: string;
    };

/**
 * Get the query parameters if correctly formated
 */
function useQueryParams(): Params {
  const router = useRouter();
  const courseId = router.query.courseId;
  const aktivitetstillfalle = router.query.aktivitetstillfalle;
  const kurstillfalle = router.query.kurstillfalle;
  const utbildningsinstans = router.query.utbildningsinstans;

  if (typeof courseId === "string" && typeof aktivitetstillfalle === "string") {
    return {
      type: "aktivitetstillfalle",
      aktivitetstillfalle,
      courseId,
    };
  } else if (
    typeof courseId === "string" &&
    typeof kurstillfalle === "string" &&
    typeof utbildningsinstans === "string"
  ) {
    return {
      type: "utbildningsinstans",
      utbildningsinstans,
      kurstillfalle,
      courseId,
    };
  }

  throw new Error(
    `This endpoint require either [aktivitetstillfalle] or [kurstillfalle]+[utbildningsinstans] as query parameters`
  );
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

function useGrades(courseId: string, assignmentId: string) {
  const result = useInfiniteQuery(
    [courseId, assignmentId, "submissions"],
    ({ pageParam = 0 }) => {
      if (assignmentId === "0") {
        return null;
      }
      return fetchCanvasGrades(courseId, assignmentId, pageParam);
    },
    {
      getNextPageParam: (lastPage, allPages) => {
        if (!lastPage) {
          return undefined;
        }

        const currentLength = allPages.reduce(
          (acc, curr) => acc + (curr?.submissions.length ?? 0),
          0
        );

        if (currentLength >= lastPage.summary.total) {
          return undefined;
        }

        return allPages.length + 1;
      },
    }
  );

  const { hasNextPage, isFetching, fetchNextPage } = result;

  useEffect(() => {
    if (!isFetching && hasNextPage) {
      fetchNextPage();
    }
  }, [isFetching, hasNextPage, fetchNextPage]);

  return result;
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
  const canvas = await getCanvasClient(context.req);

  if (!canvas) {
    return redirectUnauthenticated(context);
  }

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
};

export const getServerSideProps = withSessionSsr<{}>(_getServerSideProps);

const Gradebook: NextPage<GradebookProps> = ({ assignments }) => {
  const params = useQueryParams();
  const studentsQuery = useStudents(params);
  const [assignmentId, setAssignmentId] = useState("0");
  const gradesQuery = useGrades(params.courseId, assignmentId);

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
      {gradesQuery.isFetched && !gradesQuery.hasNextPage
        ? "Available!"
        : "Loading"}
      {gradesQuery.data?.pages.flatMap((p) => p?.submissions).length}
      {" out of "}
      {gradesQuery.data?.pages[0]?.summary.total}
    </div>
  );
};

export default Gradebook;
