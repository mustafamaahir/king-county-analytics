import React, { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { api } from "../api/client.js";
import PageHero from "../components/Layout/PageHero.jsx";
import ContinuationBanner from "../components/ContinuationBanner.jsx";
import KPICard from "../components/KPICard.jsx";
import AIInsight from "../components/AIInsight.jsx";
import LoadingState from "../components/LoadingState.jsx";

const fmt = (n) => n?.toLocaleString() ?? "—";

export default function Trends({ onNext }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get("/api/trends")
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingState tab="Trends" />;
  if (error)   return <div style={{padding:40,color:"#E87722"}}>Error: {error}</div>;

  const { monthly_chart, seasonal_chart, groq_context, ai_interpretation } = data;

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

  const { cheapest_month, priciest_month, waterfront_premium, price_change_pct, seasonal_variance_pct } = groq_context;

  return (
    <div>
      <PageHero
        chapter="Chapter 2 of 5 · Following the signal"
        title="Price Trends &"
        titleEm="Market Momentum"
        subtitle="Distributions tell us what is — trends tell us where things are going. This chapter tracks how median prices and sales volume evolved across the observation window, and identifies the seasonal patterns that buyers can exploit."
      />
      <ContinuationBanner
        from="Market Overview"
        message="now stratified by month to reveal how the market moved over time"
      />

      <div className="container">
        <div style={s.section}>
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Temporal Signals</div>
          <h2 style={s.h2}>How the Market Moved</h2>
          <div style={s.kpiGrid}>
            <KPICard label="Price Change (Period)" value={`${price_change_pct > 0 ? "+" : ""}${price_change_pct}%`} sub="first to last month" accent="blue" />
            <KPICard label="Seasonality Share"     value={`${seasonal_variance_pct ?? "—"}%`} sub="of price variance" accent="teal" />
            <KPICard label="Best Month to Buy"     value={cheapest_month} sub="lowest median prices" accent="amber" />
            <KPICard label="Waterfront Premium"    value={`$${fmt(waterfront_premium)}`} sub="above non-waterfront" accent="gold" />
          </div>

          {/* Monthly Median Price + Volume */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Monthly Median Sale Price</div>
            <div style={s.chartSub}>Rolling median price per month — shows market direction and momentum across the observation window</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly_chart} margin={{top:5,right:20,left:10,bottom:40}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="month" tick={{fontSize:10,fontFamily:"IBM Plex Mono"}} angle={-35} textAnchor="end" />
                <YAxis tick={{fontSize:10}} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v)=>[`$${fmt(v)}`, "Median Price"]} />
                <Line type="monotone" dataKey="median_price" stroke="#0055A4" strokeWidth={2.5} dot={{ r:3, fill:"#0055A4" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Seasonal Pattern */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Seasonal Price Pattern by Month</div>
            <div style={s.chartSub}>Median price indexed by calendar month — reveals the recurring seasonal cycle buyers should factor into their timing strategy</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={seasonal_chart} margin={{top:5,right:20,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="month" tick={{fontSize:10}} />
                <YAxis tick={{fontSize:10}} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v)=>[`$${fmt(v)}`, "Median Price"]} />
                <Bar dataKey="median_price" radius={[2,2,0,0]}>
                  {seasonal_chart.map((entry, i) => (
                    <Cell key={i} fill={entry.month === cheapest_month ? "#007E8A" : entry.month === priciest_month ? "#E87722" : "#0055A4"} />
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
            Next: <strong style={{color:"#E87722"}}>Market Segments →</strong>{" "}
            These trends are not uniform — clustering reveals that four distinct property tiers behave very differently from each other.
          </div>
          <button style={s.nextBtn} onClick={onNext}>Continue to Segments →</button>
        </div>
      </div>
    </div>
  );
}
