from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime

from database import SessionLocal, engine
from models import Base, TimeEntry
from schemas import TimeEntryCreate, TimeEntryUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def index():
    return FileResponse("static/index.html")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ▶️ START (ZAWSZE tworzy nowy wpis)
@app.post("/api/start")
def start_timer(entry: TimeEntryCreate, db: Session = Depends(get_db)):
    timer = TimeEntry(
        activity=entry.activity,
        category=entry.category,
        priority=entry.priority,
        status="in_progress",
        start_time=datetime.utcnow(),
        end_time=None
    )
    db.add(timer)
    db.commit()
    db.refresh(timer)
    return timer

# ⏸ PAUZA / STOP – ZAWSZE zapisuje czas
@app.post("/api/stop/{entry_id}")
def stop_timer(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(TimeEntry, entry_id)
    if entry and entry.end_time is None:
        entry.end_time = datetime.utcnow()
        db.commit()
    return {"status": "stopped"}

# 🔁 STATUS
@app.post("/api/entries/{entry_id}/toggle-status")
def toggle_status(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(TimeEntry, entry_id)
    entry.status = "done" if entry.status == "in_progress" else "in_progress"
    db.commit()
    return {"status": entry.status}

# ⭐ ULUBIONE
@app.post("/api/entries/{entry_id}/toggle-favorite")
def toggle_favorite(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(TimeEntry, entry_id)
    entry.is_favorite = not entry.is_favorite
    db.commit()
    return {"is_favorite": entry.is_favorite}

# 📋 LISTA
@app.get("/api/entries")
def get_entries(db: Session = Depends(get_db)):
    entries = db.query(TimeEntry).all()
    result = []

    for e in entries:
        if e.manual_duration_seconds is not None:
            duration = e.manual_duration_seconds
        elif e.end_time:
            duration = int((e.end_time - e.start_time).total_seconds())
        else:
            duration = 0

        result.append({
            "id": e.id,
            "activity": e.activity,
            "category": e.category,
            "priority": e.priority,
            "status": e.status,
            "is_favorite": e.is_favorite,
            "duration_seconds": duration
        })

    return result

# ✏️ EDYCJA
@app.put("/api/entries/{entry_id}")
def update_entry(entry_id: int, data: TimeEntryUpdate, db: Session = Depends(get_db)):
    entry = db.get(TimeEntry, entry_id)

    entry.activity = data.activity
    entry.category = data.category
    entry.manual_duration_seconds = data.manual_duration_seconds

    if data.status is not None:
        entry.status = data.status
    if data.priority is not None:
        entry.priority = data.priority

    db.commit()
    return {"status": "ok"}

# 🗑 USUWANIE
@app.delete("/api/entries/{entry_id}")
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.get(TimeEntry, entry_id)
    db.delete(entry)
    db.commit()
    return {"status": "ok"}

# 📊 PODSUMOWANIE
@app.get("/api/summary")
def get_summary(db: Session = Depends(get_db)):
    entries = db.query(TimeEntry).filter(TimeEntry.end_time.isnot(None)).all()
    total = sum(
        e.manual_duration_seconds
        if e.manual_duration_seconds is not None
        else int((e.end_time - e.start_time).total_seconds())
        for e in entries
    )
    return {"total_seconds": total}
