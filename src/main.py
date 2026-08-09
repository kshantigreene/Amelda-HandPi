# Copyright © 2026 Kshanti Greene. All rights reserved.

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
app.mount("/js", StaticFiles(directory="static/js"), name="js")
app.mount("/css", StaticFiles(directory="static/css"), name="css")

@app.get("/", response_class=FileResponse)
def index():
    return "static/index.html"

@app.get("/sw.js", response_class=FileResponse)
def service_worker():
    return "static/sw.js"

@app.get("/manifest.json", response_class=FileResponse)
def manifest():
    return "static/manifest.json"
