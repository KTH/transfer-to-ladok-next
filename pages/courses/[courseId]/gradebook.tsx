import type { GetServerSideProps, NextPage } from "next";
import { withSessionSsr } from "lib/withSession";
import CanvasAPI from "lib/canvasApi";
import { CanvasApiError } from "@kth/canvas-api";

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
    </div>
  );
};

export default Gradebook;
