from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from api import nodes, edges, state, export
import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.init_db()
    yield


app = FastAPI(title="Amelda", lifespan=lifespan)

app.include_router(nodes.router, prefix="/api/nodes")
app.include_router(edges.router, prefix="/api/edges")
app.include_router(state.router, prefix="/api/state")
app.include_router(export.router, prefix="/api/export")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse)
def index():
    return "static/index.html"
