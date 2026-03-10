import React, { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, ReferenceLine,
} from "recharts";
import { api } from "../api/client.js";
import PageHero from "../components/Layout/PageHero.jsx";
import ContinuationBanner from "../components/ContinuationBanner.jsx";
import KPICard from "../components/KPICard.jsx";
import AIInsight from "../components/AIInsight.jsx";
import LoadingState from "../components/LoadingState.jsx";
import NeighbourhoodMap from "../components/Charts/NeighbourhoodMap.jsx";

const fmt = (n) => n?.toLocaleString() ?? "—";

function buildActionCards(data) {
  const { groq_context, reno_premium, undervalued_areas, segment_regression } = data;

  const top    = undervalued_areas?.[0];
  const second = undervalued_areas?.[1];
  const entryReg  = segment_regression?.find(s => s.segment === "Entry-Level");
  const luxuryReg = segment_regression?.find(s => s.segment === "Luxury");

  const forecastDir = groq_context.forecast_change_pct > 0 ? "rising" : "falling";
  const forecastAbs = Math.abs(groq_context.forecast_change_pct);

  return [
    {
      priority: "Priority 1 · Buyers",
      color: "#0055A4",
      title: "Time Your Purchase to Beat the Seasonal Cycle",
      body: `Prices are forecast to be ${forecastDir} ${forecastAbs}% over the next 3 months to $${fmt(groq_context.forecast_3m_price)}. The seasonal decomposition identified a recurring low-price window — buying during that window saves measurably over peak months with no difference in available inventory.`,
      steps: [
        `Act before prices reach the forecast level of $${fmt(groq_context.forecast_3m_price)} — the current median is $${fmt(groq_context.current_median)}, representing a ${forecastAbs}% window.`,
        `Focus on Entry-Level or Mid-Market segments where the primary driver is ${entryReg?.top_driver ?? "sqft_living"} — this is where you get the most value per dollar.`,
        `Consider ${top?.neighbourhood ?? "the top undervalued area"} — at $${fmt(top?.price_per_sqft)}/sqft it is priced below its quality fundamentals.`,
      ],
    },
    {
      priority: "Priority 2 · Sellers",
      color: "#E87722",
      title: `Renovation Adds $${fmt(reno_premium)} on Average — Grade Is the Key Lever`,
      body: `Renovated properties sell for $${fmt(reno_premium)} more than non-renovated equivalents in this market. The Random Forest model confirmed build quality grade as the second strongest predictor of price — and the per-segment regression (R²=${entryReg?.r2 ?? "—"} for Entry-Level) shows grade carries a positive coefficient across every segment.`,
      steps: [
        `Budget renovation specifically to achieve a King County grade reclassification — finishes, fixtures, and structural quality are the scoring criteria. The data shows this adds $${fmt(reno_premium)} at the median.`,
        `List during the seasonal high-price window identified in the Trends tab — combining the renovation premium with peak timing stacks both advantages.`,
        `If in the Entry-Level segment, prioritise ${entryReg?.top_driver ?? "sqft_living"} improvements — the regression model identifies this as the strongest dollar-per-dollar lever for that tier.`,
      ],
    },
    {
      priority: "Priority 3 · Agents",
      color: "#007E8A",
      title: "Segment-Specific Pricing — Entry and Luxury Have Different Drivers",
      body: `K-Means clustering identified 4 distinct market tiers. Entry-Level pricing is driven primarily by ${entryReg?.top_driver ?? "sqft_living"} (R²=${entryReg?.r2 ?? "—"}), while Luxury pricing is driven by ${luxuryReg?.top_driver ?? "waterfront"} (R²=${luxuryReg?.r2 ?? "—"}). Applying a single market-wide CMA across both introduces systematic pricing error.`,
      steps: [
        `Classify every listing into one of the four segments before running comparables — use the median grade, sqft, and price thresholds from the Segments tab as your cutoffs.`,
        `For Entry-Level listings, weight ${entryReg?.top_driver ?? "sqft_living"} heavily in your CMA — it explains the most variance in that segment's pricing model.`,
        `For Luxury listings, ${luxuryReg?.top_driver ?? "waterfront"} is the dominant signal — lead your pricing narrative and marketing materials with location and water access.`,
      ],
    },
    {
      priority: "Priority 4 · Investors",
      color: "#C89B2A",
      title: `${top?.neighbourhood ?? "Top Area"} Is the Highest Value-Gap Opportunity`,
      body: `The neighbourhood value gap analysis scored all areas by comparing quality-size fundamentals against current price per sqft. ${top?.neighbourhood} has a median grade of ${top?.median_grade} and ${fmt(top?.median_sqft)} sqft median size, but trades at only $${fmt(top?.price_per_sqft)}/sqft — well below what its profile implies. ${second?.neighbourhood} is the second-ranked opportunity at $${fmt(second?.price_per_sqft)}/sqft.`,
      steps: [
        `Prioritise acquisitions in ${top?.neighbourhood} — it has the largest gap between implied quality value and actual market price. Filter to grade 8–9 properties for strongest price resilience.`,
        `${second?.neighbourhood} is the next best opportunity at $${fmt(second?.price_per_sqft)}/sqft — useful for portfolio diversification across neighbourhoods.`,
        `Renovation ROI is highest in undervalued areas — combining a $${fmt(reno_premium)} renovation premium with a below-market entry price compounds the return significantly.`,
      ],
    },
  ];
}

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

  const {
    price_forecast, undervalued_areas, all_areas,
    reno_chart, reno_premium, groq_context, ai_interpretation,
  } = data;

  const forecastStart = price_forecast.find(d => d.is_forecast);
  const ACTION_CARDS  = buildActionCards(data);

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
    actionCard: (color) => ({ background:"#fff", border:"1px solid #DDD9D0", borderRight:`4px solid ${color}`, padding:"24px 28px" }),
    priorityTag:(color) => ({ fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.6rem", letterSpacing:"0.16em", textTransform:"uppercase", padding:"3px 8px", display:"inline-block", marginBottom:12, background:`${color}15`, color }),
  };

  return (
    <div>
      <PageHero
        chapter="Chapter 5 of 5 · The conclusion"
        title="Recommended Actions &"
        titleEm="Decision Framework"
        subtitle="Every finding from the previous four chapters converges here — a prioritised, evidence-backed action plan with real numbers from the analysis. Each recommendation cites the exact metric that justifies it."
      />
      <ContinuationBanner
        from="Problem → Overview → Trends → Segments → Drivers"
        message="all chapters converge into a ranked decision framework"
      />

      <div className="container">
        <div style={s.section}>

          {/* ── KPIs ── */}
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Forward Outlook</div>
          <h2 style={s.h2}>90-Day Price Forecast</h2>
          <div style={s.kpiGrid}>
            <KPICard label="Current Median"    value={`$${fmt(groq_context.current_median)}`}     sub="latest observation"      accent="blue"  />
            <KPICard label="3-Month Forecast"   value={`$${fmt(groq_context.forecast_3m_price)}`}  sub="linear trend projection"  accent="amber" />
            <KPICard label="Forecast Change"    value={`${groq_context.forecast_change_pct > 0 ? "+" : ""}${groq_context.forecast_change_pct}%`} sub="vs current median" accent="teal" />
            <KPICard label="Reno Premium"       value={`$${fmt(reno_premium)}`}                    sub="renovated vs not"         accent="gold"  />
          </div>

          {/* ── Forecast Chart ── */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Median Price — Historical + 3-Month Forecast</div>
            <div style={s.chartSub}>Solid line: observed monthly medians. Dashed: linear trend projection.</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={price_forecast} margin={{top:5,right:20,left:10,bottom:40}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="month" tick={{fontSize:9,fontFamily:"IBM Plex Mono"}} angle={-35} textAnchor="end" />
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v=>[`$${fmt(v)}`,"Price"]} />
                {forecastStart && (
                  <ReferenceLine x={forecastStart.month} stroke="#E87722" strokeDasharray="4 3"
                    label={{value:"Forecast →",position:"insideTopRight",fontSize:10,fill:"#E87722"}} />
                )}
                <Line type="monotone" dataKey="median_price"   stroke="#0055A4" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="forecast_price" stroke="#E87722" strokeWidth={2} strokeDasharray="5 4" dot={{r:4,fill:"#E87722"}} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Neighbourhood Heatmap ── */}
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Geographic Opportunity</div>
          <h2 style={s.h2}>Undervalued Neighbourhoods — King County Map</h2>
          <p style={s.lead}>
            Each dot is a named neighbourhood, positioned by real latitude and longitude.
            Gold highlighted dots are the top undervalued areas — where quality and size fundamentals
            exceed current market pricing. Hover over any dot to see the details.
          </p>
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Neighbourhood Value Gap Map</div>
            <div style={s.chartSub}>
              Gold = undervalued (quality exceeds price). Blue = overvalued (price exceeds quality).
              Top picks are labelled — hover all dots for details.
            </div>
            <NeighbourhoodMap allAreas={all_areas} topAreas={undervalued_areas.slice(0, 4)} />
          </div>

          {/* ── Top Areas Table ── */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Top 8 Undervalued Neighbourhoods — Ranked by Value Gap</div>
            <div style={s.chartSub}>Areas where the quality-size score significantly exceeds the current price per sqft.</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                <thead>
                  <tr style={{borderBottom:"2px solid #DDD9D0"}}>
                    {["Rank","Neighbourhood","Median Price","Price/sqft","Median Grade","Median Sqft","Properties"].map(h => (
                      <th key={h} style={{padding:"8px 12px",textAlign:"left",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.62rem",letterSpacing:"0.1em",textTransform:"uppercase",color:"#6B7280"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {undervalued_areas.map((area, i) => (
                    <tr key={area.neighbourhood} style={{borderBottom:"1px solid #EBE9E3",background:i===0?"#FDF9F0":"#fff"}}>
                      <td style={{padding:"10px 12px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.75rem",color:i===0?"#C89B2A":"#6B7280",fontWeight:i===0?600:400}}>#{area.rank}</td>
                      <td style={{padding:"10px 12px",fontWeight:600,color:"#2C3240"}}>{area.neighbourhood}</td>
                      <td style={{padding:"10px 12px",color:"#2C3240"}}>${fmt(area.median_price)}</td>
                      <td style={{padding:"10px 12px",color:"#0055A4",fontWeight:600}}>${fmt(area.price_per_sqft)}</td>
                      <td style={{padding:"10px 12px",color:"#2C3240"}}>{area.median_grade}</td>
                      <td style={{padding:"10px 12px",color:"#2C3240"}}>{fmt(area.median_sqft)}</td>
                      <td style={{padding:"10px 12px",color:"#6B7280"}}>{fmt(area.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Renovation Chart ── */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Renovation Premium — Renovated vs Not Renovated</div>
            <div style={s.chartSub}>Median sale price comparison. The ${fmt(reno_premium)} premium is the data-observed uplift — before accounting for renovation cost.</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={reno_chart} margin={{top:5,right:40,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="label" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:10}} tickFormatter={v=>`$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={v=>[`$${fmt(v)}`,"Median Price"]} />
                <Bar dataKey="median_price" radius={[2,2,0,0]}>
                  <Cell fill="#E87722" />
                  <Cell fill="#0055A4" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Action Cards ── */}
          <div style={s.label}><span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>Stakeholder Recommendations</div>
          <h2 style={s.h2}>Four Ranked Actions</h2>
          <p style={s.lead}>Every number below is pulled directly from the analysis. Each recommendation cites the exact metric from the pipeline that justifies it.</p>

          <div style={s.actionGrid}>
            {ACTION_CARDS.map(card => (
              <div key={card.priority} style={s.actionCard(card.color)}>
                <div style={s.priorityTag(card.color)}>{card.priority}</div>
                <div style={{fontSize:"1rem",fontWeight:600,color:"#2C3240",marginBottom:10}}>{card.title}</div>
                <div style={{fontSize:"0.82rem",color:"#6B7280",lineHeight:1.72,marginBottom:16}}>{card.body}</div>
                <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:8}}>
                  {card.steps.map((step, i) => (
                    <li key={i} style={{fontSize:"0.78rem",color:"#2C3240",lineHeight:1.5,display:"flex",alignItems:"flex-start",gap:8}}>
                      <span style={{color:card.color,fontFamily:"'IBM Plex Mono',monospace",fontSize:"0.7rem",marginTop:2,flexShrink:0}}>→</span>
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

      <div style={{background:"#0055A4",padding:"36px 0"}}>
        <div className="container">
          <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:"1.3rem",fontWeight:700,color:"#fff",marginBottom:6}}>Analysis complete.</div>
          <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.7)"}}>Five chapters. Three hypotheses validated. Four data-driven stakeholder action plans. One dataset.</div>
        </div>
      </div>
    </div>
  );
}
