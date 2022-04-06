declare global {
  var _mongoClientPromise: Promise<MongoClient>;

  namespace NodeJS {
    interface ProcessEnv {
      CANVAS_API_URL: string;
      CANVAS_OAUTH_CLIENT_ID: string;
      CANVAS_OAUTH_CLIENT_SECRET: string;
      MONGODB_URI: string;
    }
  }
}

export {};
