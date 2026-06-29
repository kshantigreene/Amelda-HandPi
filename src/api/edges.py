from fastapi import APIRouter, HTTPException
from models import EdgeCreate, EdgeUpdate
import db

router = APIRouter()


@router.get("/")
def list_edges():
    return db.list_edges()


@router.get("/{edge_id}")
def get_edge(edge_id: str):
    return {}


@router.post("/", status_code=201)
def create_edge(body: EdgeCreate):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    return db.create_edge(body.id, body.from_id, body.to_id, body.relationship_type, body.creator, now, body.weight)


@router.put("/{edge_id}")
def update_edge(edge_id: str, body: EdgeUpdate):
    return {"id": edge_id, **body.model_dump(exclude_none=True)}


@router.delete("/{edge_id}", status_code=204)
def delete_edge(edge_id: str):
    return None
