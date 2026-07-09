from fastapi import APIRouter
from models import AppStateUpdate
import db

router = APIRouter()


@router.get("/")
def get_state():
    return db.get_app_state()


@router.put("/")
def update_state(body: AppStateUpdate):
    return db.set_app_state(body.current_note_id, body.mode)