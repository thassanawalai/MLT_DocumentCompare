from fastapi import FastAPI
from app.api.routes import router
from app.core.config import setup_cors

app = FastAPI(
    title="PDF Extraction API",
    version="1.0"
)

setup_cors(app)

app.include_router(router, prefix="/api/v1")