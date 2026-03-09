import React, { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine } from "recharts";
import { api } from "../api/client.js";
import PageHero from "../components/Layout/PageHero.jsx";
import ContinuationBanner from "../components/ContinuationBanner.jsx";
import KPICard from "../components/KPICard.jsx";
import AIInsight from "../components/AIInsight.jsx";
import LoadingState from "../components/LoadingState.jsx";

const fmt = (n) => n?.toLocaleString() ?? "—";

const ACTION_CARDS = [
  {
    priority: "Priority 1 · Buyers",
    color: "#0055A4",
    title: "Time Your Purchase for Seasonal Savings",
    body: "Seasonal decomposition shows prices follow a predictable annual cycle. Buying in the identified low-price month saves measurably compared to peak spring months — with no difference in available inventory for most property tiers.",
    steps: [
      "Target purchase completion in the low-price seasonal window identified in the Trends tab.",
      "Use the segment scatter plot to identify comparable properties — avoid anchoring on asking price alone.",
      "Focus on grade 7–8 properties in neighbourhoods with high sqft_living15 — you benefit from the neighbourhood premium without paying the full luxury price.",
    ],
  },
  {
    priority: "Priority 2 · Sellers",
    color: "#E87722",
    title: "Grade Improvement Has the Highest ROI",
    body: "The Drivers analysis confirms that build quality grade is the second strongest price predictor. A grade increase from 7 to 8 adds significant value on average — renovation work that achieves this reclassification generates returns far exceeding its cost in most segments.",
    steps: [
      "Get a pre-sale grade assessment from King County to understand your current rating and what would be required to move up.",
      "Focus renovation budget on the specific criteria King County uses to differentiate grade 7 from 8 — finishes, fixtures, and structural quality.",
      "List in the high-price seasonal month and lead with the grade improvement in all marketing materials.",
    ],
  },
  {
    priority: "Priority 3 · Agents",
    color: "#007E8A",
    title: "Price by Segment, Not by Average",
    body: "A single market-wide pricing heuristic systematically misprices properties in the tails. Entry-level and luxury segments have different primary drivers — applying the same pricing logic across both leads to underpricing in one and overpricing in the other.",
    steps: [
      "Classify every new listing into one of the four market segments before conducting comparables analysis.",
      "Use the per-segment regression coefficients from the Drivers analysis to build a segment-specific pricing model.",
      "Monitor sqft_living15 — a property in a high-quality neighbourhood commands a premium independent of its own size.",
    ],
  },
  {
    priority: "Priority 4 · Investors",
    color: "#C89B2A",
    title: "Target Undervalued ZIP Codes",
    body: "The value gap analysis identifies ZIP codes where the quality and size profile of properties is meaningfully higher than the price per sqft suggests. These represent acquisition opportunities where market pricing has not yet caught up with fundamental value.",
    steps: [
      "Prioritise the top undervalued ZIP codes identified in the analysis — filter to those with at least 20 sales for statistical reliability.",
      "Focus on grade 8–9 properties with renovation history — these show the strongest price resilience across market cycles.",
      "Track the leading indicator (waterfront premium stability) as a signal of luxury market health — it tends to lead broader market moves.",
    ],
  },
];

export default function Actions() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    api.get("/api/actions")
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <LoadingState tab="Actions" />;
  if (error)   return <div style={{padding:40,color:"#E87722"}}>Error: {error}</div>;

  const { price_forecast, undervalued_chart, reno_chart, reno_premium, groq_context, ai_interpretation } = data;

  const forecastStart = price_forecast.find((d) => d.is_forecast);

  const s = {
    section:    { padding:"48px 0", borderTop:"1px solid #DDD9D0" },
    label:      { fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.65rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#0055A4", marginBottom:6, display:"flex", alignItems:"center", gap:8 },
    h2:         { fontSize:"clamp(1.3rem,2.5vw,1.75rem)", color:"#2C3240", marginBottom:8 },
    lead:       { color:"#6B7280", fontSize:"0.88rem", lineHeight:1.75, maxWidth:640, marginBottom:28 },
    kpiGrid:    { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 },
    chartCard:  { background:"#fff", border:"1px solid #DDD9D0", padding:24, marginBottom:24 },
    chartTitle: { fontWeight:600, fontSize:"0.9rem", color:"#2C3240", marginBottom:4 },
    chartSub:   { fontSize:"0.72rem", color:"#6B7280", marginBottom:16 },
    actionGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:28 },
    actionCard: (color) => ({
      background:"#fff", border:"1px solid #DDD9D0",
      borderRight:`4px solid ${color}`, padding:"24px 28px",
    }),
    priorityTag:(color) => ({
      fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.6rem",
      letterSpacing:"0.16em", textTransform:"uppercase",
      padding:"3px 8px", display:"inline-block", marginBottom:12,
      background:`${color}15`, color,
    }),
    actionTitle:{ fontSize:"1rem", fontWeight:600, color:"#2C3240", marginBottom:10 },
    actionBody: { fontSize:"0.82rem", color:"#6B7280", lineHeight:1.72, marginBottom:16 },
    stepList:   { listStyle:"none", display:"flex", flexDirection:"column", gap:8 },
    step:       (color) => ({
      fontSize:"0.78rem", color:"#2C3240", lineHeight:1.5,
      display:"flex", alignItems:"flex-start", gap:8,
    }),
    stepArrow:  (color) => ({
      color, fontFamily:"'IBM Plex Mono',monospace",
      fontSize:"0.7rem", marginTop:2, flexShrink:0,
    }),
  };

  return (
    <div>
      <PageHero
        chapter="Chapter 5 of 5 · The conclusion"
        title="Recommended Actions &"
        titleEm="Decision Framework"
        subtitle="This is where insight becomes strategy. Every finding from the previous four chapters is synthesised into a prioritised, evidence-backed action plan — with a price forecast, renovation ROI, undervalued ZIP codes, and stakeholder-specific recommendations."
      />
      <ContinuationBanner
        from="Problem → Overview → Trends → Segments → Drivers"
        message="all chapters converge into a ranked decision framework"
      />

      <div className="container">
        {/* Forecast KPIs */}
        <div style={s.section}>
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Forward Outlook</div>
          <h2 style={s.h2}>90-Day Price Forecast</h2>
          <div style={s.kpiGrid}>
            <KPICard label="Current Median Price"  value={`$${fmt(groq_context.current_median)}`}    sub="latest observation"     accent="blue"  />
            <KPICard label="3-Month Forecast"       value={`$${fmt(groq_context.forecast_3m_price)}`} sub="linear trend projection" accent="amber" />
            <KPICard label="Forecast Change"        value={`${groq_context.forecast_change_pct > 0 ? "+" : ""}${groq_context.forecast_change_pct}%`} sub="vs current median" accent="teal" />
            <KPICard label="Renovation Premium"     value={`$${fmt(reno_premium)}`}                   sub="renovated vs not"        accent="gold"  />
          </div>

          {/* Price Forecast Chart */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Median Price — Historical + 3-Month Forecast</div>
            <div style={s.chartSub}>Solid line shows observed monthly medians. Dashed line shows the linear trend projection — the shaded region marks the forecast window.</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={price_forecast} margin={{top:5,right:20,left:10,bottom:40}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="month" tick={{fontSize:9,fontFamily:"IBM Plex Mono"}} angle={-35} textAnchor="end" />
                <YAxis tick={{fontSize:10}} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v)=>[`$${fmt(v)}`,"Median Price"]} />
                {forecastStart && (
                  <ReferenceLine x={forecastStart.month} stroke="#E87722" strokeDasharray="4 3" label={{value:"Forecast →",position:"insideTopRight",fontSize:10,fill:"#E87722"}} />
                )}
                <Line type="monotone" dataKey="median_price"  stroke="#0055A4" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="forecast_price" stroke="#E87722" strokeWidth={2} strokeDasharray="5 4" dot={{r:4,fill:"#E87722"}} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Undervalued ZIPs */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Top Undervalued ZIP Codes — Price per Sqft vs Quality Score</div>
            <div style={s.chartSub}>ZIP codes where grade and size quality outpaces current pricing — identified acquisition opportunities for investors.</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={undervalued_chart} margin={{top:5,right:20,left:10,bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="zipcode" tick={{fontSize:10}} label={{value:"ZIP Code",position:"insideBottom",offset:-10,fontSize:11}} />
                <YAxis tick={{fontSize:10}} tickFormatter={(v)=>`$${v}`} />
                <Tooltip formatter={(v,n)=>n==="price_per_sqft"?[`$${fmt(v)}/sqft`,"Price per sqft"]:[v,n]} />
                <Bar dataKey="price_per_sqft" radius={[2,2,0,0]}>
                  {undervalued_chart.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#C89B2A" : "#0055A4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Action Cards */}
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Stakeholder Recommendations</div>
          <h2 style={s.h2}>Four Ranked Actions</h2>
          <p style={s.lead}>Each action traces directly back to a specific finding in the analysis chain. Ranked by expected impact and ease of implementation.</p>

          <div style={s.actionGrid}>
            {ACTION_CARDS.map((card) => (
              <div key={card.priority} style={s.actionCard(card.color)}>
                <div style={s.priorityTag(card.color)}>{card.priority}</div>
                <div style={s.actionTitle}>{card.title}</div>
                <div style={s.actionBody}>{card.body}</div>
                <ul style={s.stepList}>
                  {card.steps.map((step, i) => (
                    <li key={i} style={s.step(card.color)}>
                      <span style={s.stepArrow(card.color)}>→</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <AIInsight text={ai_interpretation} />
        </div>
      </div>

      {/* Conclusion strip */}
      <div style={{background:"#0055A4",padding:"36px 0"}}>
        <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:"1.3rem",fontWeight:700,color:"#fff",marginBottom:6}}>
              Analysis complete.
            </div>
            <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.7)"}}>
              Five chapters. Three hypotheses validated. Four stakeholder action plans. One dataset.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
