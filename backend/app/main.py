from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from app.api.routes import router
from app.core.config import setup_cors
import os

app = FastAPI(
    title="PDF Extraction API",
    version="1.0"
)

setup_cors(app)

# API routes
app.include_router(router, prefix="/api/v1")

# Path to the directory containing the built frontend files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Mount the 'assets' directory which contains CSS, JS, etc.
app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

# Catch-all endpoint to serve the 'index.html' for any other path.
# This is needed to support client-side routing in the React app.
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))