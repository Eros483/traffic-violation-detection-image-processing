# ----- fastapi app entry point @ api/main.py -----

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routes import analytics, challans, evidence, violations
from api.schemas import HealthResponse

app = FastAPI(title="Traffic Violation Detection API", version="0.1.0")

# Allow all origins for prototype frontend testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(violations.router, prefix="/api/violations", tags=["violations"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["evidence"])
app.include_router(challans.router, prefix="/api/challans", tags=["challans"])


@app.get("/health", response_model=HealthResponse, tags=["health"])
def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}


# Serve built frontend as static files (optional — API works without it)
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "client", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
