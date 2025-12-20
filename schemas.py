from pydantic import BaseModel
from typing import Optional

class TimeEntryCreate(BaseModel):
    activity: str
    category: Optional[str] = None
    priority: Optional[str] = "medium"


class TimeEntryUpdate(BaseModel):
    activity: str
    category: Optional[str] = None
    manual_duration_seconds: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
