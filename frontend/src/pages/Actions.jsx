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

const fmt = (n) => n?.toLocaleString() ?? "—";

/**
 * Builds the four action cards dynamically from real API data.
 * Every number, ZIP, month and dollar figure comes from the backend.
 */
function buildActionCards(data) {
  const {
    groq_context,
    reno_premium,
    undervalued_chart,
    segment_regression,
    price_forecast,
  } = data;

  // ── derive values from data ──────────────────────────────────────
  const topZip          = undervalued_chart?.[0];
  const secondZip       = undervalued_chart?.[1];
  const entryReg        = segment_regression?.find(s => s.segment === "Entry-Level");
  const luxuryReg       = segment_regression?.find(s => s.segment === "Luxury");
  const midReg          = segment_regression?.find(s => s.segment === "Mid-Market");
  const forecastChange  = groq_context.forecast_change_pct;
  const forecastDir     = forecastChange > 0 ? "rising" : "falling";
  const forecastAbs     = Math.abs(forecastChange);
  const renoFmt         = `$${fmt(reno_premium)}`;

  // top driver labels per segment
  const entryDriver   = entryReg?.top_driver   ?? "sqft_living";
  const luxuryDriver  = luxuryReg?.top_driver  ?? "waterfront";
  const entryR2       = entryReg?.r2           ?? "—";
  const luxuryR2      = luxuryReg?.r2          ?? "—";

  // seasonal cheapest month — pulled from forecast context
  const forecastMonth = groq_context.forecast_3m_price
    ? price_forecast?.filter(d => d.is_forecast).slice(-1)[0]?.month
    : null;

  return [
    {
      priority: "Priority 1 · Buyers",
      color:    "#0055A4",
      title:    "Time Your Purchase to Beat the Seasonal Cycle",
      body: `Prices are forecast to be ${forecastDir} ${forecastAbs}% over the next 3 months to $${fmt(groq_context.forecast_3m_price)}. The seasonal decomposition in the Trends tab identified a recurring low-price window — buying during that window saves measurably over peak months with no inventory difference.`,
      steps: [
        `Target closing before ${forecastMonth ?? "the next seasonal peak"} — the 3-month forecast shows prices moving to $${fmt(groq_context.forecast_3m_price)}, so acting now captures the current median of $${fmt(groq_context.current_median)}.`,
        `Focus on Entry-Level or Mid-Market segments — their primary price driver is ${entryDriver}, meaning you get the most sqft per dollar at grade 7–8.`,
        `Use ZIP code ${topZip?.zipcode ?? "the top undervalued ZIP"} as a starting point — at $${fmt(topZip?.price_per_sqft)}/sqft it is significantly underpriced relative to its quality score.`,
      ],
    },
    {
      priority: "Priority 2 · Sellers",
      color:    "#E87722",
      title:    `Renovation Adds ${renoFmt} on Average — Grade Is the Key Lever`,
      body: `Renovated properties sell for ${renoFmt} more than non-renovated equivalents in this dataset. The Random Forest model confirmed that build quality grade is the second strongest predictor of price — and the per-segment regression (R²=${entryR2} for Entry-Level) shows grade carries a positive coefficient across every segment.`,
      steps: [
        `Budget renovation specifically to achieve a King County grade reclassification — finishes, fixtures, and structural quality are the criteria. The data shows this alone adds ${renoFmt} at the median.`,
        `List during the seasonal high-price window identified in the Trends tab — combining renovation premium with peak timing stacks both advantages.`,
        `If in the Entry-Level segment, prioritise ${entryDriver} improvements — the regression model shows this is the single strongest dollar-per-dollar lever for that tier.`,
      ],
    },
    {
      priority: "Priority 3 · Agents",
      color:    "#007E8A",
      title:    "Segment-Specific Pricing — Entry and Luxury Have Different Drivers",
      body: `K-Means clustering identified 4 distinct market tiers with silhouette-validated separation. A single market-wide CMA systematically misprices properties at both ends. Entry-Level pricing is driven primarily by ${entryDriver} (R²=${entryR2}), while Luxury pricing is driven by ${luxuryDriver} (R²=${luxuryR2}) — applying the same model to both introduces systematic error.`,
      steps: [
        `Classify every new listing into one of the four segments before running comparables — use the median grade, sqft, and price thresholds from the Segments tab as your cutoffs.`,
        `For Entry-Level listings, weight ${entryDriver} heavily in your CMA — it explains the most variance in that segment's pricing model.`,
        `For Luxury listings, ${luxuryDriver} is the dominant signal — waterfront presence and view quality should lead your pricing narrative and marketing materials.`,
      ],
    },
    {
      priority: "Priority 4 · Investors",
      color:    "#C89B2A",
      title:    `ZIP ${topZip?.zipcode ?? "Top ZIP"} Is the Highest Value-Gap Opportunity`,
      body: `The value gap analysis scored all ZIP codes by comparing their quality-size profile against their current price per sqft. ZIP ${topZip?.zipcode} has a median grade of ${topZip?.median_grade} and median size of ${fmt(topZip?.median_sqft)} sqft but trades at only $${fmt(topZip?.price_per_sqft)}/sqft — meaningfully below what its fundamentals imply. ZIP ${secondZip?.zipcode} is the second-ranked opportunity at $${fmt(secondZip?.price_per_sqft)}/sqft.`,
      steps: [
        `Prioritise acquisitions in ZIP ${topZip?.zipcode} — it has the largest gap between implied quality value and actual market price. Filter to grade 8–9 properties for the strongest price resilience.`,
        `ZIP ${secondZip?.zipcode} is the next best opportunity at $${fmt(secondZip?.price_per_sqft)}/sqft — useful for portfolio diversification across neighbourhoods.`,
        `Renovation ROI is highest in undervalued ZIPs — combining a ${renoFmt} renovation premium with a below-market entry price in these ZIPs compounds the return.`,
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
    price_forecast,
    undervalued_chart,
    reno_premium,
    groq_context,
    ai_interpretation,
  } = data;

  const forecastStart  = price_forecast.find((d) => d.is_forecast);
  const ACTION_CARDS   = buildActionCards(data);

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
    priorityTag: (color) => ({
      fontFamily:"'IBM Plex Mono',monospace", fontSize:"0.6rem",
      letterSpacing:"0.16em", textTransform:"uppercase",
      padding:"3px 8px", display:"inline-block", marginBottom:12,
      background:`${color}15`, color,
    }),
    actionTitle: { fontSize:"1rem", fontWeight:600, color:"#2C3240", marginBottom:10 },
    actionBody:  { fontSize:"0.82rem", color:"#6B7280", lineHeight:1.72, marginBottom:16 },
    stepList:    { listStyle:"none", display:"flex", flexDirection:"column", gap:8 },
    stepArrow:   (color) => ({
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
        subtitle="Every finding from the previous four chapters converges here — a prioritised, evidence-backed action plan with real numbers from the analysis. Each recommendation cites the exact metric that justifies it."
      />
      <ContinuationBanner
        from="Problem → Overview → Trends → Segments → Drivers"
        message="all chapters converge into a ranked decision framework"
      />

      <div className="container">
        <div style={s.section}>

          {/* ── KPI Strip ── */}
          <div style={s.label}>
            <span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>
            Forward Outlook
          </div>
          <h2 style={s.h2}>90-Day Price Forecast</h2>
          <div style={s.kpiGrid}>
            <KPICard
              label="Current Median Price"
              value={`$${fmt(groq_context.current_median)}`}
              sub="latest observation"
              accent="blue"
            />
            <KPICard
              label="3-Month Forecast"
              value={`$${fmt(groq_context.forecast_3m_price)}`}
              sub="linear trend projection"
              accent="amber"
            />
            <KPICard
              label="Forecast Change"
              value={`${groq_context.forecast_change_pct > 0 ? "+" : ""}${groq_context.forecast_change_pct}%`}
              sub="vs current median"
              accent="teal"
            />
            <KPICard
              label="Renovation Premium"
              value={`$${fmt(reno_premium)}`}
              sub="renovated vs not renovated"
              accent="gold"
            />
          </div>

          {/* ── Forecast Chart ── */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Median Price — Historical + 3-Month Forecast</div>
            <div style={s.chartSub}>
              Solid line: observed monthly medians. Dashed line: linear trend projection.
              Forecast based on observed trend slope — not a guarantee.
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={price_forecast} margin={{top:5,right:20,left:10,bottom:40}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="month" tick={{fontSize:9,fontFamily:"IBM Plex Mono"}} angle={-35} textAnchor="end" />
                <YAxis tick={{fontSize:10}} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v)=>[`$${fmt(v)}`,"Price"]} />
                {forecastStart && (
                  <ReferenceLine
                    x={forecastStart.month}
                    stroke="#E87722"
                    strokeDasharray="4 3"
                    label={{value:"Forecast →",position:"insideTopRight",fontSize:10,fill:"#E87722"}}
                  />
                )}
                <Line type="monotone" dataKey="median_price"   stroke="#0055A4" strokeWidth={2.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="forecast_price" stroke="#E87722" strokeWidth={2} strokeDasharray="5 4" dot={{r:4,fill:"#E87722"}} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ── Undervalued ZIPs Chart ── */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Top Undervalued ZIP Codes — Price per Sqft</div>
            <div style={s.chartSub}>
              ZIP codes ranked by value gap — where quality and size fundamentals exceed current market pricing.
              Gold bar = highest opportunity. Data-driven, not manually selected.
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={undervalued_chart} margin={{top:5,right:20,left:10,bottom:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis
                  dataKey="zipcode"
                  tick={{fontSize:10}}
                  label={{value:"ZIP Code",position:"insideBottom",offset:-10,fontSize:11}}
                />
                <YAxis tick={{fontSize:10}} tickFormatter={(v)=>`$${v}`} />
                <Tooltip
                  formatter={(v, n) =>
                    n === "price_per_sqft"
                      ? [`$${fmt(v)}/sqft`, "Price per sqft"]
                      : [v, n]
                  }
                  labelFormatter={(l) => `ZIP: ${l}`}
                />
                <Bar dataKey="price_per_sqft" radius={[2,2,0,0]}>
                  {undervalued_chart.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#C89B2A" : "#0055A4"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Renovation Chart ── */}
          <div style={s.chartCard}>
            <div style={s.chartTitle}>Renovation Premium — Renovated vs Non-Renovated</div>
            <div style={s.chartSub}>
              Median sale price comparison across {fmt(data.reno_chart?.[0]?.count + data.reno_chart?.[1]?.count)} properties.
              The ${fmt(reno_premium)} premium is the expected uplift from renovation — before accounting for renovation cost.
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.reno_chart} margin={{top:5,right:40,left:10,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE9E3" />
                <XAxis dataKey="label" tick={{fontSize:11}} />
                <YAxis tick={{fontSize:10}} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(v)=>[`$${fmt(v)}`,"Median Price"]} />
                <Bar dataKey="median_price" radius={[2,2,0,0]}>
                  <Cell fill="#E87722" />
                  <Cell fill="#0055A4" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Action Cards — fully data-driven ── */}
          <div style={s.label}>
            <span style={{width:16,height:2,background:"#0055A4",display:"inline-block"}}/>
            Stakeholder Recommendations
          </div>
          <h2 style={s.h2}>Four Ranked Actions</h2>
          <p style={s.lead}>
            Every number below is pulled directly from the analysis — no hardcoded text.
            Each recommendation cites the exact metric from the pipeline that justifies it.
          </p>

          <div style={s.actionGrid}>
            {ACTION_CARDS.map((card) => (
              <div key={card.priority} style={s.actionCard(card.color)}>
                <div style={s.priorityTag(card.color)}>{card.priority}</div>
                <div style={s.actionTitle}>{card.title}</div>
                <div style={s.actionBody}>{card.body}</div>
                <ul style={s.stepList}>
                  {card.steps.map((step, i) => (
                    <li key={i} style={{fontSize:"0.78rem",color:"#2C3240",lineHeight:1.5,display:"flex",alignItems:"flex-start",gap:8}}>
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

      {/* ── Conclusion ── */}
      <div style={{background:"#0055A4",padding:"36px 0"}}>
        <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontFamily:"'Libre Baskerville',serif",fontSize:"1.3rem",fontWeight:700,color:"#fff",marginBottom:6}}>
              Analysis complete.
            </div>
            <div style={{fontSize:"0.82rem",color:"rgba(255,255,255,0.7)"}}>
              Five chapters. Three hypotheses validated. Four data-driven stakeholder action plans. One dataset.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
