import type {
  NextPage,
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from "next";
import Head from "next/head";
import styles from "../../../styles/Home.module.css";
import { withSessionSsr } from "lib/withSession";
import CanvasAPI, {
  getCanvasClient,
  redirectUnauthenticated,
  Section,
} from "lib/canvasApi";
import {
  getAktivitetstillfalle,
  getModulesInKurstillfalle,
} from "lib/ladokApi";
import { CanvasApiError } from "@kth/canvas-api";
import Link from "next/link";
import { useRouter } from "next/router";

interface HomeProps {
  aktivitetstillfalle: {
    id: string;
    name: string;
  }[];
  kurstillfalle: {
    id: string;
    utbildningsinstansId: string;
    name: string;
    modules: {
      id: string;
      examCode: string;
      name: string;
    }[];
  }[];
}

/**
 * Given a list of Canvas sections, returns a list of unique
 * aktivitetstillfalleUID
 */
function getUniqueAktivitetstillfalle(sections: Section[]) {
  const AKTIVITETSTILLFALLE_REGEX = /^AKT\.([a-z0-9-]+)(\.FUNKA)?$/;

  const ids = sections
    .map((s) => AKTIVITETSTILLFALLE_REGEX.exec(s.sis_section_id)?.[1])
    .filter((id): id is string => id !== undefined);

  // Remove duplicates
  return Array.from(new Set(ids));
}

function isKurstillfalle(section: Section) {
  const KURSTILLFALLE_REGEX = /^\w{6,7}[HT|VT]\d\d\d$/;

  return KURSTILLFALLE_REGEX.test(section.sis_section_id);
}

async function completeAktivitetstillfalleInformation(
  aktivitestillfalleUID: string
) {
  const ladokAkt = await getAktivitetstillfalle(aktivitestillfalleUID);
  const codes = ladokAkt.Aktiviteter.map(
    (a) =>
      `${a.Kursinstans.Utbildningskod} ${a.Utbildningsinstans.Utbildningskod}`
  );
  const date = ladokAkt.Datumperiod.Startdatum;

  return {
    id: aktivitestillfalleUID,
    name: `${codes} ${date}`,
  };
}

async function completeKurstillfalleInformation(section: Section) {
  const ktf = await getModulesInKurstillfalle(section.integration_id);

  return {
    id: section.integration_id,
    utbildningsinstansId: ktf.UtbildningsinstansUID,
    name: section.sis_section_id,
    modules: ktf.IngaendeMoment.map((m) => ({
      id: m.UtbildningsinstansUID,
      examCode: m.Utbildningskod,
      name: m.Benamning.en,
    })),
  };
}

const _getServerSideProps: GetServerSideProps<HomeProps> = async (context) => {
  const canvas = await getCanvasClient(context.req);
  if (!canvas) {
    return redirectUnauthenticated(context);
  }

  const allSections = await canvas.getCanvasSections(
    context.query.courseId as string
  );

  const aktivitetstillfalle = await Promise.all(
    getUniqueAktivitetstillfalle(allSections).map(
      completeAktivitetstillfalleInformation
    )
  );

  const kurstillfalle = await Promise.all(
    allSections.filter(isKurstillfalle).map(completeKurstillfalleInformation)
  );

  return {
    props: {
      aktivitetstillfalle,
      kurstillfalle,
    },
  };
};

export const getServerSideProps = withSessionSsr<{}>(_getServerSideProps);

const Home: NextPage<HomeProps> = ({ aktivitetstillfalle, kurstillfalle }) => {
  const router = useRouter();
  const courseId = router.query.courseId as string;

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Transfer to Ladok!</h1>

        <div>
          <p>Choose what do you want to grade</p>
          {aktivitetstillfalle.length > 0 && (
            <div>
              <h2>Examinations</h2>
              <ul>
                {aktivitetstillfalle.map((akt) => (
                  <li key={akt.id}>
                    <Link
                      href={`/courses/${courseId}/gradebook?aktivitetstillfalle=${akt.id}`}
                    >
                      <a>{akt.name}</a>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {kurstillfalle.length > 0 && (
            <div>
              <h2>Modules</h2>
              {kurstillfalle.map((ktf) => (
                <div key={ktf.id}>
                  <h3 key={ktf.id}>{ktf.name}</h3>
                  <ul>
                    {ktf.modules.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={`/courses/${courseId}/gradebook?kurstillfalle=${ktf.id}&utbildningsinstans=${m.id}`}
                        >
                          <a>
                            {m.examCode} {m.name}
                          </a>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link
                        href={`/courses/${courseId}/gradebook?kurstillfalle=${ktf.id}&utbildningsinstans=${ktf.utbildningsinstansId}`}
                      >
                        <a>Final Grade</a>
                      </Link>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
