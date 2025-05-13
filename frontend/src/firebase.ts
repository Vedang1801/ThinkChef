import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Check if the environment variables are loaded properly
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

console.log("Firebase Config:", { apiKey, authDomain, projectId });

// Fallback to hard-coded values if env variables are undefined
const firebaseConfig = {
  apiKey: apiKey || "AIzaSyAaVc5lgcIRhN3ryoNquX7YNHndnSfOUY8",
  authDomain: authDomain || "think-chef-7fe30.firebaseapp.com",
  projectId: projectId || "think-chef-7fe30",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
