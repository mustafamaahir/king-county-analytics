import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api/client.js";
import PageHero from "../components/Layout/PageHero.jsx";
import ContinuationBanner from "../components/ContinuationBanner.jsx";
import KPICard from "../components/KPICard.jsx";
import AIInsight from "../components/AIInsight.jsx";
import LoadingState from "../components/LoadingState.jsx";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function Overview({ onNext }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.get("/api/overview")
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingState tab="Overview" />;
  if (error)   return <div style={{padding:40,color:"#E87722"}}>Error: {error}</div>;

  const { kpis, price_distribution, grade_chart, ai_interpretation } = data;

  const s = {
    section:   { padding: "48px 0", borderTop: "1px solid #DDD9D0" },
    label:     { fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#0055A4", marginBottom:6, display:"flex", alignItems:"center", gap:8 },
    h2:        { fontSize:"clamp(1.3rem,2.5vw,1.75rem)", color:"#2C3240", marginBottom:8 },
    lead:      { color:"#6B7280", fontSize:"0.88rem", lineHeight:1.75, maxWidth:640, marginBottom:28 },
    kpiGrid:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 },
    chartCard: { background:"#fff", border:"1px solid #DDD9D0", padding:24, marginBottom:24 },
    chartTitle:{ fontWeight:600, fontSize:"0.9rem", color:"#2C3240", marginBottom:4 },
    chartSub:  { fontSize:"0.72rem", color:"#6B7280", marginBottom:16 },
    nextStrip: { background:"#EBE9E3", border:"1px solid #DDD9D0", borderLeft:"4px solid #E87722", padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:36 },
    nextBtn:   { fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.72rem", letterSpacing:"0.08em", textTransform:"uppercase", background:"#E87722", color:"#fff", border:"none", padding:"10px 22px", cursor:"pointer" },
  };

  return (
    <div>
      <PageHero
        chapter="Chapter 1 of 5 · Setting the scene"
        title="King County Market"
        titleEm="Overview"
        subtitle="Before drawing conclusions, we must understand the data. This chapter profiles 21,613 property sales — price ranges, quality grades, size distributions, and construction eras — providing the empirical foundation for every subsequent claim."
      />
      <ContinuationBanner
        from="Problem Statement"
        message="the three hypotheses are now tested against real market data"
      />

      <div className="container">
        {/* KPIs */}
        <div style={s.section}>
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Market at a Glance</div>
          <h2 style={s.h2}>Key Market Indicators</h2>
          <div style={s.kpiGrid}>
            <KPICard label="Total Properties Sold"  value={fmt(kpis.total_properties)} sub={`${kpis.date_range_start} – ${kpis.date_range_end}`} accent="blue" />
            <KPICard label="Median Sale Price"       value={`$${fmt(kpis.median_price)}`} sub="50th percentile" accent="amber" />
            <KPICard label="Median Living Area"      value={`${fmt(kpis.median_sqft)} sqft`} sub="interior space" accent="teal" />
            <KPICard label="Waterfront Properties"   value={fmt(kpis.waterfront_count)} sub="premium waterfront" accent="gold" />
          </div>

          {/* Price Distribution */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Price Distribution</div>
            <div style={s.chartSub}>Number of properties sold per price bracket — reveals market concentration and skew</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={price_distribution} margin={{ top:5, right:20, left:10, bottom:40 }}>
                <XAxis dataKey="range" tick={{ fontSize:10, fontFamily:"IBM Plex Mono" }} angle={-35} textAnchor="end" />
                <YAxis tick={{ fontSize:10 }} />
                <Tooltip formatter={(v) => [fmt(v), "Properties"]} />
                <Bar dataKey="count" radius={[2,2,0,0]}>
                  {price_distribution.map((_, i) => (
                    <Cell key={i} fill={i < 4 ? "#0055A4" : i < 8 ? "#007E8A" : "#E87722"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Grade vs Median Price */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Build Quality Grade vs Median Sale Price</div>
            <div style={s.chartSub}>King County grades properties 1–13. Grade directly reflects construction quality and finishes — this chart shows the price premium each grade commands.</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={grade_chart} margin={{ top:5, right:20, left:10, bottom:5 }}>
                <XAxis dataKey="grade" tick={{ fontSize:10 }} label={{ value:"Grade", position:"insideBottom", offset:-2, fontSize:10 }} />
                <YAxis tick={{ fontSize:10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v) => [`$${fmt(v)}`, "Median Price"]} />
                <Bar dataKey="median_price" radius={[2,2,0,0]}>
                  {grade_chart.map((entry, i) => (
                    <Cell key={i} fill={entry.grade >= 11 ? "#C89B2A" : entry.grade >= 9 ? "#007E8A" : entry.grade >= 7 ? "#0055A4" : "#DDD9D0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <AIInsight text={ai_interpretation} />
        </div>
      </div>

      <div style={s.nextStrip}>
        <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"}}>
          <div style={{fontSize:"0.85rem",color:"#2C3240"}}>
            Next: <strong style={{color:"#E87722"}}>Price Trends →</strong>{" "}
            We know the landscape — now we ask: how did prices move across the observation window?
          </div>
          <button style={s.nextBtn} onClick={onNext}>Continue to Trends →</button>
        </div>
      </div>
    </div>
  );
}
