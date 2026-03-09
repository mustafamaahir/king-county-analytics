import React, { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, CartesianGrid } from "recharts";
import { api } from "../api/client.js";
import PageHero from "../components/Layout/PageHero.jsx";
import ContinuationBanner from "../components/ContinuationBanner.jsx";
import KPICard from "../components/KPICard.jsx";
import AIInsight from "../components/AIInsight.jsx";
import LoadingState from "../components/LoadingState.jsx";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function Segments({ onNext }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get("/api/segments")
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingState tab="Segments" />;
  if (error)   return <div style={{padding:40,color:"#E87722"}}>Error: {error}</div>;

  const { segment_profiles, scatter_data, silhouette_score, groq_context, ai_interpretation } = data;

  const s = {
    section:    { padding:"48px 0", borderTop:"1px solid #DDD9D0" },
    label:      { fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#0055A4", marginBottom:6, display:"flex", alignItems:"center", gap:8 },
    h2:         { fontSize:"clamp(1.3rem,2.5vw,1.75rem)", color:"#2C3240", marginBottom:8 },
    lead:       { color:"#6B7280", fontSize:"0.88rem", lineHeight:1.75, maxWidth:640, marginBottom:28 },
    kpiGrid:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 },
    chartCard:  { background:"#fff", border:"1px solid #DDD9D0", padding:24, marginBottom:24 },
    chartTitle: { fontWeight:600, fontSize:"0.9rem", color:"#2C3240", marginBottom:4 },
    chartSub:   { fontSize:"0.72rem", color:"#6B7280", marginBottom:16 },
    segGrid:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 },
    segCard:    (color) => ({ background:"#fff", border:"1px solid #DDD9D0", borderTop:`3px solid ${color}`, padding:"20px 18px" }),
    nextStrip:  { background:"#EBE9E3", border:"1px solid #DDD9D0", borderLeft:"4px solid #E87722", padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:36 },
    nextBtn:    { fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.72rem", letterSpacing:"0.08em", textTransform:"uppercase", background:"#E87722", color:"#fff", border:"none", padding:"10px 22px", cursor:"pointer" },
  };

  return (
    <div>
      <PageHero
        chapter="Chapter 3 of 5 · Beneath the average"
        title="Market Segments &"
        titleEm="Property Tiers"
        subtitle="Averages lie. This chapter uses K-Means clustering to break the King County market into four distinct property tiers — revealing that what drives price in an entry-level home is fundamentally different from what drives price in a luxury property."
      />
      <ContinuationBanner
        from="Price Trends"
        message="aggregate trends now disaggregated into four distinct market segments"
      />

      <div className="container">
        <div style={s.section}>
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Cluster Analysis</div>
          <h2 style={s.h2}>Four Distinct Property Tiers</h2>
          <p style={s.lead}>K-Means clustering (K=4, silhouette score: {silhouette_score}) identifies four well-separated market tiers. Each has a unique profile — pricing, size, quality, and location all differ meaningfully across segments.</p>

          {/* Segment Profile Cards */}
          <div style={s.segGrid}>
            {segment_profiles.map((seg) => (
              <div key={seg.id} style={s.segCard(seg.color)}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.6rem",letterSpacing:"0.12em",textTransform:"uppercase",color:seg.color,marginBottom:8}}>{seg.name}</div>
                <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:"1.6rem",fontWeight:700,color:seg.color,lineHeight:1,marginBottom:4}}>{seg.share_pct}%</div>
                <div style={{fontSize:"0.72rem",color:"#6B7280",marginBottom:12}}>of market</div>
                <div style={{fontSize:"0.8rem",color:"#2C3240",fontWeight:600}}>${fmt(seg.median_price)}</div>
                <div style={{fontSize:"0.7rem",color:"#6B7280"}}>median price</div>
                <div style={{marginTop:10,fontSize:"0.72rem",color:"#6B7280",lineHeight:1.6}}>
                  <div>Median grade: {seg.median_grade}</div>
                  <div>Median size: {fmt(seg.median_sqft)} sqft</div>
                  <div>Waterfront: {seg.waterfront_pct}%</div>
                </div>
              </div>
            ))}
          </div>

          {/* Scatter: sqft vs price, coloured by segment */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Living Area vs Sale Price — Coloured by Segment</div>
            <div style={s.chartSub}>Each point is one property. The four segment colours reveal how the market naturally stratifies — confirming these are genuine market divisions, not statistical artefacts.</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{top:5,right:20,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis type="number" dataKey="sqft_living" name="Living Area" unit=" sqft" tick={{fontSize:10}} label={{value:"Living Area (sqft)",position:"insideBottom",offset:-5,fontSize:11}} />
                <YAxis type="number" dataKey="price" name="Price" tickFormatter={(v)=>`$${(v/1000).toFixed(0)}K`} tick={{fontSize:10}} />
                <Tooltip cursor={{strokeDasharray:"3 3"}} formatter={(v,n)=>n==="price"?[`$${fmt(v)}`,"Price"]:[`${fmt(v)} sqft`,"Size"]} />
                <Scatter data={scatter_data} fill="#0055A4">
                  {scatter_data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.55} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <AIInsight text={ai_interpretation} />
        </div>
      </div>

      <div style={s.nextStrip}>
        <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}>
          <div style={{fontSize:"0.85rem",color:"#2C3240"}}>
            Next: <strong style={{color:"#E87722"}}>Price Drivers →</strong>{" "}
            We know who the segments are — now we ask why they're priced the way they are. Feature importance reveals the real levers.
          </div>
          <button style={s.nextBtn} onClick={onNext}>Continue to Drivers →</button>
        </div>
      </div>
    </div>
  );
}
