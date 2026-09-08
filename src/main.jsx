import React from "react";
import ReactDOM from "react-dom/client";
import Samadhan from "./Samadhan.jsx";
import "./index.css";

// The app uses window.storage (provided by the Claude artifact runtime) to keep
// demo progress across reloads. Outside that runtime it does not exist, so we
// back it with localStorage here. Everything else runs unchanged.
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const v = localStorage.getItem(key);
      if (v === null) throw new Error("not found");
      return { key, value: v };
    },
    set: async (key, value) => { localStorage.setItem(key, value); return { key, value }; },
    delete: async (key) => { localStorage.removeItem(key); return { key, deleted: true }; },
    list: async (prefix = "") => ({ keys: Object.keys(localStorage).filter((k) => k.startsWith(prefix)) }),
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Samadhan />
  </React.StrictMode>
);
