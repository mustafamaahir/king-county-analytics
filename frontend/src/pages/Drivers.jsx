import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LineChart, Line } from "recharts";
import { api } from "../api/client.js";
import PageHero from "../components/Layout/PageHero.jsx";
import ContinuationBanner from "../components/ContinuationBanner.jsx";
import KPICard from "../components/KPICard.jsx";
import AIInsight from "../components/AIInsight.jsx";
import LoadingState from "../components/LoadingState.jsx";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function Drivers({ onNext }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get("/api/drivers")
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingState tab="Drivers" />;
  if (error)   return <div style={{padding:40,color:"#E87722"}}>Error: {error}</div>;

  const { feature_importance_chart, grade_box_chart, sqft_chart, model_metrics, groq_context, ai_interpretation } = data;

  const s = {
    section:    { padding:"48px 0", borderTop:"1px solid #DDD9D0" },
    label:      { fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#0055A4", marginBottom:6, display:"flex", alignItems:"center", gap:8 },
    h2:         { fontSize:"clamp(1.3rem,2.5vw,1.75rem)", color:"#2C3240", marginBottom:8 },
    lead:       { color:"#6B7280", fontSize:"0.88rem", lineHeight:1.75, maxWidth:640, marginBottom:28 },
    kpiGrid:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 },
    chartCard:  { background:"#fff", border:"1px solid #DDD9D0", padding:24, marginBottom:24 },
    chartTitle: { fontWeight:600, fontSize:"0.9rem", color:"#2C3240", marginBottom:4 },
    chartSub:   { fontSize:"0.72rem", color:"#6B7280", marginBottom:16 },
    nextStrip:  { background:"#EBE9E3", border:"1px solid #DDD9D0", borderLeft:"4px solid #E87722", padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:36 },
    nextBtn:    { fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.72rem", letterSpacing:"0.08em", textTransform:"uppercase", background:"#E87722", color:"#fff", border:"none", padding:"10px 22px", cursor:"pointer" },
  };

  const top8 = feature_importance_chart.slice(0, 8);

  return (
    <div>
      <PageHero
        chapter="Chapter 4 of 5 · Finding the levers"
        title="Price Drivers &"
        titleEm="Causal Signals"
        subtitle="Knowing segments exist is not enough — we need to understand what causes price to be high or low. This chapter uses a Random Forest model to rank every feature by its contribution to price, and quantifies the dollar value of each lever."
      />
      <ContinuationBanner
        from="Market Segments"
        message="feature importance is run across all segments to find universal and segment-specific drivers"
      />

      <div className="container">
        <div style={s.section}>
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Random Forest Results</div>
          <h2 style={s.h2}>What Actually Drives Price</h2>
          <div style={s.kpiGrid}>
            <KPICard label="Model R² Score"       value={model_metrics.r2}              sub="variance explained"    accent="blue"  />
            <KPICard label="Median Abs. Error"    value={`$${fmt(model_metrics.mae)}`}   sub="typical prediction gap" accent="amber" />
            <KPICard label="Top Feature"          value={groq_context.top_feature.split(" ")[0]} sub={`${groq_context.top_feature_pct}% importance`} accent="teal" />
            <KPICard label="Grade 7→8 Premium"    value={`$${fmt(groq_context.grade_7_to_8_delta)}`} sub="average price uplift" accent="gold" />
          </div>

          {/* Feature Importance — Horizontal Bar */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Feature Importance — Top 8 Predictors</div>
            <div style={s.chartSub}>Random Forest importance scores — higher means the feature explains more price variance. The top 3 features combined account for {groq_context.top3_combined_pct}% of all predictive power.</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={top8} layout="vertical" margin={{top:5,right:60,left:160,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" horizontal={false} />
                <XAxis type="number" tick={{fontSize:10}} tickFormatter={(v)=>`${(v*100).toFixed(0)}%`} />
                <YAxis type="category" dataKey="label" tick={{fontSize:11,fontFamily:"IBM Plex Sans"}} width={155} />
                <Tooltip formatter={(v)=>[`${(v*100).toFixed(1)}%`, "Importance"]} />
                <Bar dataKey="importance" radius={[0,2,2,0]}>
                  {top8.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#0055A4" : i === 1 ? "#007E8A" : i === 2 ? "#E87722" : "#C8C4BA"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* sqft vs price curve */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Living Area vs Median Price — Non-linear Relationship</div>
            <div style={s.chartSub}>Price gains from additional square footage compress above ~4,000 sqft — a threshold effect that matters for renovation decisions.</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={sqft_chart} margin={{top:5,right:20,left:10,bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="sqft" tick={{fontSize:10}} label={{value:"Living Area (sqft)",position:"insideBottom",offset:-10,fontSize:11}} />
                <YAxis tick={{fontSize:10}} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v)=>[`$${fmt(v)}`,"Median Price"]} />
                <Line type="monotone" dataKey="median_price" stroke="#0055A4" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <AIInsight text={ai_interpretation} />
        </div>
      </div>

      <div style={s.nextStrip}>
        <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}>
          <div style={{fontSize:"0.85rem",color:"#2C3240"}}>
            Final chapter: <strong style={{color:"#E87722"}}>Actions →</strong>{" "}
            All five chapters converge here — ranked recommendations for buyers, sellers, agents, and investors, backed by the full evidence chain.
          </div>
          <button style={s.nextBtn} onClick={onNext}>Continue to Actions →</button>
        </div>
      </div>
    </div>
  );
}
