# Copyright © 2026 Kshanti Greene. All rights reserved.

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Literal, Optional
import re

_SAFE_ID = re.compile(r'^[a-zA-Z0-9_-]{1,64}$')

NODE_TYPES = Literal["concept", "free"]
EDGE_TYPES = Literal["user", "auto", "sequence"]


def _validate_id(v: str) -> str:
    if not _SAFE_ID.match(v):
        raise ValueError("ID must be 1-64 alphanumeric/dash/underscore characters")
    return v


class NodeCreate(BaseModel):
    id: str
    text_content: Optional[str] = Field(None, max_length=10_000)
    other_content: Optional[str] = Field(None, max_length=10_000)
    node_type: NODE_TYPES
    creator: str = Field(..., max_length=64)
    previous_id: Optional[str] = None

    @field_validator("id", "creator")
    @classmethod
    def safe_id(cls, v: str) -> str:
        return _validate_id(v)

    @field_validator("previous_id")
    @classmethod
    def safe_previous_id(cls, v: Optional[str]) -> Optional[str]:
        return v if v is None else _validate_id(v)


class NodeUpdate(BaseModel):
    text_content: Optional[str] = Field(None, max_length=10_000)
    other_content: Optional[str] = Field(None, max_length=10_000)
    node_type: Optional[NODE_TYPES] = None


class EdgeCreate(BaseModel):
    id: str
    from_id: str
    to_id: str
    directed: bool = True
    relationship_type: Optional[EDGE_TYPES] = None
    weight: Optional[float] = Field(None, ge=-1e9, le=1e9)
    creator: str = Field(..., max_length=64)

    @field_validator("id", "from_id", "to_id", "creator")
    @classmethod
    def safe_id(cls, v: str) -> str:
        return _validate_id(v)

    @model_validator(mode="after")
    def default_weights(self):
        if self.relationship_type == "auto" and self.weight is None:
            self.weight = 0.1
        if self.relationship_type == "user" and self.weight is None:
            self.weight = 1.0
        return self


class EdgeUpdate(BaseModel):
    directed: Optional[bool] = None
    relationship_type: Optional[EDGE_TYPES] = None
    weight: Optional[float] = Field(None, ge=-1e9, le=1e9)


class AppStateUpdate(BaseModel):
    current_note_id: Optional[str] = None
    mode: Literal["new", "view", "edit"] = "new"

    @field_validator("current_note_id")
    @classmethod
    def safe_current_note_id(cls, v: Optional[str]) -> Optional[str]:
        return v if v is None else _validate_id(v)
