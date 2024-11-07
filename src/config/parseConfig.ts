import Parse from 'parse';

const initializeParse = () => {
  try {
    if (!Parse.applicationId) {
      const appId = import.meta.env.VITE_PARSE_APP_ID;
      const jsKey = import.meta.env.VITE_PARSE_JS_KEY;

      if (!appId || !jsKey) {
        throw new Error('Parse configuration is missing. Please check your environment variables.');
      }

      Parse.initialize(appId, jsKey);
      Parse.serverURL = 'https://parseapi.back4app.com/';
    }
  } catch (error) {
    console.error('Parse initialization error:', error);
    throw error;
  }
};

export default { initializeParse };