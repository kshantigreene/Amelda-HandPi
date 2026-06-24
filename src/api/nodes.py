from fastapi import APIRouter, HTTPException
from models import NodeCreate, NodeUpdate
import db

router = APIRouter()


@router.get("/")
def list_nodes():
    return db.list_nodes()


@router.get("/{node_id}")
def get_node(node_id: str):
    return {}


@router.post("/", status_code=201)
def create_node(body: NodeCreate):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    print("node created: ", body)
    return db.create_node(body.id, body.text_content or "", body.node_type, body.creator, now)


@router.put("/{node_id}")
def update_node(node_id: str, body: NodeUpdate):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    result = db.update_node(node_id, body.text_content or "", now)
    print("node updated: ",body)
    if result is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return result


@router.delete("/{node_id}", status_code=204)
def delete_node(node_id: str):
    return None
