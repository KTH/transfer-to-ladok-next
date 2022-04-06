declare global {
  var _mongoClientPromise: Promise<MongoClient>;

  namespace NodeJS {
    interface ProcessEnv {
      CANVAS_API_URL: string;
      CANVAS_DEVELOPER_KEY_ID: string;
      CANVAS_DEVELOPER_KEY_SECRET: string;
      MONGODB_URI: string;
      NEXTAUTH_SECRET: string;
    }
  }
}

export {};
