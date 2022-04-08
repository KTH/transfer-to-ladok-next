import got, { HTTPError, Method, Headers } from "got";

export class LadokApiError extends Error {
  public options?: {
    headers: Headers;
    url: string;
    method: Method;
  };

  public response?: {
    body: unknown;
    headers: Headers;
    ip?: string;
    retryCount: number;
    statusCode: number;
    statusMessage?: string;
  };

  public code: number;

  constructor(gotError: HTTPError) {
    super(gotError.message);
    this.code = gotError.response.statusCode;
    this.name = "LadokApiError";
    this.options = {
      headers: gotError.options.headers,
      url: gotError.options.url.toString(),
      method: gotError.options.method,
    };
    this.response = {
      body: gotError.response.body,
      headers: gotError.response.headers,
      ip: gotError.response.ip,
      retryCount: gotError.response.retryCount,
      statusCode: gotError.response.statusCode,
      statusMessage: gotError.response.statusMessage,
    };

    this.options.headers.authorization = "[HIDDEN]";
  }
}

function minimalErrorHandler(err: unknown): never {
  if (err instanceof HTTPError) {
    const error = new LadokApiError(err);
    throw error;
  }

  throw err;
}

export function getGotClient() {
  return got.extend({
    prefixUrl: process.env.LADOK_API_BASEURL,
    https: {
      pfx: Buffer.from(process.env.LADOK_API_PFX_BASE64!, "base64"),
      passphrase: process.env.LADOK_API_PFX_PASSPHRASE,
    },
    headers: {
      Accept: "application/vnd.ladok-resultat+json",
    },
    responseType: "json",
  });
}

interface Aktivitetstillfalle {
  Aktiviteter: {
    Kursinstans: {
      Utbildningskod: string;
    };
    Utbildningsinstans: {
      Utbildningskod: string;
    };
  }[];
  Datumperiod: {
    Startdatum: string;
  };
}

interface Kurstillfalle {
  UtbildningsinstansUID: string;
  IngaendeMoment: {
    UtbildningsinstansUID: string;
    Utbidlningskod: string;
    Benamning: {
      en: string;
      sv: string;
    };
  }[];
}

export async function getAktivitetstillfalle(aktivitetstillfalleUID: string) {
  return getGotClient()
    .get<Aktivitetstillfalle>(
      `resultat/aktivitetstillfalle/${aktivitetstillfalleUID}`
    )
    .then((response) => response.body)
    .catch(minimalErrorHandler);
}

export async function getModulesInKurstillfalle(kurstillfalleUID: string) {
  return getGotClient()
    .get<Kurstillfalle>(`resultat/kurstillfalle/${kurstillfalleUID}/moment`)
    .then((response) => response.body)
    .catch(minimalErrorHandler);
}