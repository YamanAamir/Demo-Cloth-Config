import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./AutoTranslate";
import { AuthProvider } from "./context/AuthContext";

// basename="/Demo-Clothing-Configurator"
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
);
