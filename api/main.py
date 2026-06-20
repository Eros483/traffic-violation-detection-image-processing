# ----- fastapi app entry point @ api/main.py -----

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import analytics, evidence, violations
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


@app.get("/health", response_model=HealthResponse, tags=["health"])
def health_check():
    """Basic health check endpoint."""
    return {"status": "ok"}
