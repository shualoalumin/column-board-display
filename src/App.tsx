import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { StartPage } from "./routes/StartPage";
import { PrototypePage } from "./routes/PrototypePage";
import { WritePage } from "./routes/WritePage";
import { DisplayPage } from "./routes/DisplayPage";
import { ViewerPage } from "./routes/ViewerPage";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/prototype" element={<PrototypePage />} />
        <Route path="/write/:roomId" element={<WritePage />} />
        <Route path="/display/:roomId" element={<DisplayPage />} />
        <Route path="/viewer/:roomId" element={<ViewerPage />} />
      </Routes>
    </BrowserRouter>
  );
};
