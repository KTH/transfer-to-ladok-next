import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider basePath="transfer-to-ladok/api/auth" session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;
