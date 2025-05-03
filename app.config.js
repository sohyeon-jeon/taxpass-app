import 'dotenv/config'; 

export default ({ config }) => {
  return {
    ...config,
    extra: {
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL, 
    },
  };
};
