import React from "react";
import PageHero from "../components/Layout/PageHero.jsx";

const hypotheses = [
  {
    label: "Hypothesis 1 — The 80/20 Rule",
    text: "A small number of features explain the majority of price variance. Grade, living area, and location will dominate — validating a parsimonious pricing model.",
  },
  {
    label: "Hypothesis 2 — Segment Heterogeneity",
    text: "The market is not homogeneous. Distinct property tiers exist with different pricing dynamics — what drives entry-level prices differs from what drives luxury prices.",
  },
  {
    label: "Hypothesis 3 — Actionable Signals",
    text: "The data contains enough signal to generate concrete, ranked recommendations — for buyers on timing, sellers on renovation ROI, and investors on undervalued ZIP codes.",
  },
];

export default function Problem({ onNext }) {
  const s = {
    section: { padding: "52px 0", borderTop: "1px solid #DDD9D0" },
    label: {
      fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.65rem",
      letterSpacing: "0.2em", textTransform: "uppercase",
      color: "#0055A4", marginBottom: 6,
      display: "flex", alignItems: "center", gap: 8,
    },
    h2: { fontSize: "clamp(1.3rem,2.5vw,1.75rem)", color: "#2C3240", marginBottom: 8 },
    lead: { color: "#6B7280", fontSize: "0.88rem", lineHeight: 1.75, maxWidth: 640, marginBottom: 28 },
    problemBox: {
      background: "#fff", border: "1px solid #DDD9D0",
      padding: "36px", marginBottom: 28, position: "relative",
    },
    problemTag: {
      position: "absolute", top: -1, left: 28,
      fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.6rem",
      letterSpacing: "0.2em", background: "#0055A4", color: "#fff", padding: "4px 10px",
    },
    p: { fontSize: "0.92rem", lineHeight: 1.85, color: "#2C3240", marginBottom: 14 },
    hypGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 28 },
    hyp: { background: "#F7F6F2", border: "1px solid #DDD9D0", padding: "18px" },
    hypLabel: {
      fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.6rem",
      letterSpacing: "0.14em", textTransform: "uppercase", color: "#0055A4", marginBottom: 8,
    },
    hypText: { fontSize: "0.8rem", color: "#6B7280", lineHeight: 1.65 },
    nextStrip: {
      background: "#EBE9E3", border: "1px solid #DDD9D0",
      borderLeft: "4px solid #E87722", padding: "20px 28px",
      display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36,
    },
    nextBtn: {
      fontFamily: "'IBM Plex Mono',monospace", fontSize: "0.72rem",
      letterSpacing: "0.08em", textTransform: "uppercase",
      background: "#E87722", color: "#fff", border: "none",
      padding: "10px 22px", cursor: "pointer",
    },
  };

  return (
    <div>
      <PageHero
        chapter="Chapter 0 of 5 · Where it begins"
        title="What Problem Are"
        titleEm="We Solving?"
        subtitle="The real estate market is opaque — pricing is inconsistent, intuition-driven, and systematically inefficient. This analysis asks: can data reveal what truly drives house prices in King County, and turn that into a decision tool for buyers, sellers, and investors?"
      />

      <div className="container">
        <div style={s.section}>
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Business Context</div>
          <h2 style={s.h2}>The Challenge</h2>
          <p style={s.lead}>Every data story starts with a tension — a gap between where decisions are being made and where the evidence sits. This project closes that gap for King County real estate.</p>

          <div style={s.problemBox}>
            <div style={s.problemTag}>BUSINESS PROBLEM</div>
            <p style={s.p}>
              Residential real estate transactions in King County, Washington involve some of the largest financial decisions individuals make in their lifetimes — yet pricing remains largely intuition-driven. Sellers rely on agent heuristics, buyers anchor on asking prices, and neither party has access to a systematic, evidence-based framework for understanding what a property is actually worth and why.
            </p>
            <p style={s.p}>
              This analysis uses 21,613 property sales from May 2014 to May 2015 to answer three questions: <strong>What does the market look like?</strong> <strong>What drives price?</strong> <strong>What should different stakeholders do about it?</strong>
            </p>
            <p style={{...s.p, marginBottom: 0}}>
              The analysis is structured as a five-chapter narrative. Each tab builds directly on the previous one — from market overview through segmentation and causal drivers, arriving at a ranked set of actionable recommendations backed by machine learning.
            </p>

            <div style={s.hypGrid}>
              {hypotheses.map((h) => (
                <div key={h.label} style={s.hyp}>
                  <div style={s.hypLabel}>{h.label}</div>
                  <p style={s.hypText}>{h.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={s.nextStrip}>
        <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}>
          <div style={{fontSize:"0.85rem",color:"#2C3240"}}>
            Next: <strong style={{color:"#E87722"}}>Market Overview →</strong>{" "}
            Establish the empirical foundation — what does the King County housing dataset actually contain?
          </div>
          <button style={s.nextBtn} onClick={onNext}>Continue to Overview →</button>
        </div>
      </div>
    </div>
  );
}
