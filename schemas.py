from pydantic import BaseModel
from typing import Optional
from datetime import date

class TimeEntryCreate(BaseModel):
    activity: str
    category: Optional[str] = None
    priority: Optional[str] = "medium"
    task_date: Optional[date] = None


class TimeEntryUpdate(BaseModel):
    activity: str
    category: Optional[str] = None
    manual_duration_seconds: Optional[int] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    task_date: Optional[date] = None
