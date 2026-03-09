import React, { useState } from "react";
import Header   from "./components/Layout/Header.jsx";
import Problem  from "./pages/Problem.jsx";
import Overview from "./pages/Overview.jsx";
import Trends   from "./pages/Trends.jsx";
import Segments from "./pages/Segments.jsx";
import Drivers  from "./pages/Drivers.jsx";
import Actions  from "./pages/Actions.jsx";

const TAB_ORDER = ["problem", "overview", "trends", "segments", "drivers", "actions"];

export default function App() {
  const [activeTab, setActiveTab] = useState("problem");

  const goNext = () => {
    const idx = TAB_ORDER.indexOf(activeTab);
    if (idx < TAB_ORDER.length - 1) {
      setActiveTab(TAB_ORDER[idx + 1]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Global keyframe styles */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        * { animation-fill-mode: both; }
      `}</style>

      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Page container — pushes below fixed header */}
      <main style={{ paddingTop: 60, animation: "fadeIn 0.3s ease" }}>
        {activeTab === "problem"  && <Problem  onNext={goNext} />}
        {activeTab === "overview" && <Overview onNext={goNext} />}
        {activeTab === "trends"   && <Trends   onNext={goNext} />}
        {activeTab === "segments" && <Segments onNext={goNext} />}
        {activeTab === "drivers"  && <Drivers  onNext={goNext} />}
        {activeTab === "actions"  && <Actions  />}
      </main>
    </>
  );
}
