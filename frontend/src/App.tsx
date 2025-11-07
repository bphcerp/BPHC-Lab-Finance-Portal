import { GoogleOAuthProvider } from "@react-oauth/google";
import React from "react";
import { ToastContainer } from "react-toastify";
import { UserProvider } from "./context/UserContext";
import "./index.css";
import "./globalFetch.js";
import "react-toastify/dist/ReactToastify.css";
import { Routing } from "./Routing";

export const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_OAUTH_CID}>
      <ToastContainer />
      <React.StrictMode>
        <UserProvider>
          <Routing />
        </UserProvider>
      </React.StrictMode>
    </GoogleOAuthProvider>
  );
};
