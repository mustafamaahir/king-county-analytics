"""
main.py
FastAPI application entry point.
Runs all ML pipelines once on startup, stores results in cache.
All API routes then serve cached results instantly.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from utils.data_loader import load_data
from utils.cache import set_result, all_keys
import pipelines.overview  as pipeline_overview
import pipelines.trends    as pipeline_trends
import pipelines.segments  as pipeline_segments
import pipelines.drivers   as pipeline_drivers
import pipelines.actions   as pipeline_actions

from routes.overview  import router as overview_router
from routes.trends    import router as trends_router
from routes.segments  import router as segments_router
from routes.drivers   import router as drivers_router
from routes.actions   import router as actions_router

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs once at server startup.
    Loads data and executes all ML pipelines before accepting requests.
    """
    log.info("── Loading dataset ──────────────────────────────")
    df = load_data()
    log.info(f"   {len(df):,} properties loaded and cleaned")

    pipelines = [
        ("overview",  pipeline_overview),
        ("trends",    pipeline_trends),
        ("segments",  pipeline_segments),
        ("drivers",   pipeline_drivers),
        ("actions",   pipeline_actions),
    ]

    for name, pipeline in pipelines:
        log.info(f"── Running pipeline: {name} ──────────────────────")
        result = pipeline.run(df)
        set_result(name, result)
        log.info(f"   ✓ {name} cached")

    log.info(f"── All pipelines complete. Cache keys: {all_keys()} ──")
    yield
    log.info("── Server shutting down ──────────────────────────")


app = FastAPI(
    title="King County Housing Analytics API",
    description="AI-powered real estate analytics for King County, WA",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS — allows the React frontend on Vercel to call this API ──────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",                        # Vite dev server
        "https://*.vercel.app",                         # Vercel preview deploys
        "https://king-county-analytics-ibk2.vercel.app"       # Your production URL
    ],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# ── Register route handlers ──────────────────────────────────────────
app.include_router(overview_router)
app.include_router(trends_router)
app.include_router(segments_router)
app.include_router(drivers_router)
app.include_router(actions_router)


# ── Health check — used by Render and the cron job keepalive ─────────
@app.get("/health")
def health():
    keys = all_keys()
    return {
        "status":          "ready" if len(keys) == 5 else "warming_up",
        "pipelines_ready": keys,
        "total_pipelines": 5,
    }


# ── Root ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "project": "King County Housing Analytics",
        "docs":    "/docs",
        "health":  "/health",
    }
