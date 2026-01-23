from sqlalchemy import Column, Integer, String, DateTime, Boolean, Date
from datetime import datetime, date
from database import Base

class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)

    activity = Column(String, nullable=False)
    category = Column(String, nullable=True)
    priority = Column(String, default="medium")  # low | medium | high



    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    manual_duration_seconds = Column(Integer, nullable=True)

    status = Column(String, default="in_progress")
    is_favorite = Column(Boolean, default=False)
