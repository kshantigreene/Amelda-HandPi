# Copyright (c) 2026 Kshanti Greene. All rights reserved.

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="Amelda")

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

@app.get("/amelda-default.json", response_class=FileResponse)
def default_graph():
    return "static/amelda-default.json"

@app.get("/menu.png", response_class=FileResponse)
def menu_icon():
    return "static/menu.png"