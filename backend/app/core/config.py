from fastapi.middleware.cors import CORSMiddleware

def setup_cors(app):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://5173-cs-722e0dc1-6d35-463a-bcc8-1cafec142b66.cs-asia-southeast1-palm.cloudshell.dev"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )