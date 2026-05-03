import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.js";
import "./styles/global.css";
import "./styles/navbar.css";
import "./styles/home.css";

createRoot(document.getElementById("root")).render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(
      HelmetProvider,
      null,
      React.createElement(
        BrowserRouter,
        null,
        React.createElement(App)
      )
    )
  )
);
