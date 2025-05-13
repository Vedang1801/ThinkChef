// This declares the types for the firebase.js module
declare module "./firebase" {
  import { Auth } from "firebase/auth";
  
  // Export the auth instance
  export const auth: Auth;
}
