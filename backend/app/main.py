from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import documents, analysis, explore

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-domain interactive PDF learning API powered by PyMuPDF and Google Gemini SDK."
)

# CORS configuration for Next.js frontend (local and Render deployment)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(documents.router)
app.include_router(analysis.router)
app.include_router(explore.router)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "endpoints": {
            "documents": "/api/documents",
            "analysis": "/api/analysis",
            "explore": "/api/explore"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_configured": bool(settings.GEMINI_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
