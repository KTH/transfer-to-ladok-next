import type { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { withSessionSsr } from "lib/withSession";

const _getServerSideProps: GetServerSideProps = async (context) => {
  if (context.req.session) {
    const { accessToken } = context.req.session;

    if (accessToken) {
      // TODO: More advanced check
      return {
        props: {},
      };
    }
  }

  return {
    redirect: {
      destination: "/unauthenticated",
      permanent: false,
    },
  };
};

export const getServerSideProps = withSessionSsr(_getServerSideProps);

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to Transfer to Ladok!</h1>

        <div>Choose a which module do you want to grade</div>
      </main>
    </div>
  );
};

export default Home;
