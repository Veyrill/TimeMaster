# ⏱ Time Tracker MVP

Prosta aplikacja webowa do mierzenia i zarządzania czasem pracy nad zadaniami.  
Projekt został przygotowany jako MVP (Minimal Viable Product) na potrzeby zajęć akademickich.

Aplikacja umożliwia mierzenie czasu, grupowanie aktywności, ustawianie priorytetów oraz generowanie prostych podsumowań.

---

## 🎯 Funkcjonalności

- ▶️ Start / Pauza / Stop timera  
- ⏸ Pauza bez zapisywania czasu (prawdziwe wznawianie)  
- 🧾 Historia aktywności  
- ⏱ Sumowanie czasu dla tej samej aktywności  
- 🗂 Kategorie:
  - wybór z listy  
  - własna kategoria (tekstowa)  
- ⭐ Ulubione aktywności:
  - oznaczanie gwiazdką  
  - ulubione wyświetlane na górze listy  
- 🚦 Priorytety zadań:
  - niski 🟢  
  - średni 🟡  
  - wysoki 🔴  
- 🔁 Status zadania:
  - w trakcie  
  - zakończone (zmieniany ręcznie)  
- ✏️ Edycja wpisu:
  - nazwa  
  - kategoria  
  - czas (HH:MM:SS)  
- 🗑 Usuwanie aktywności  
- 📊 Podsumowania:
  - łączny czas dnia  
  - podsumowanie wg kategorii  
- 🔄 Reset dnia  
- 🐳 Uruchamianie przez Dockera  

---

## 🧱 Technologie

- Backend: FastAPI (Python)  
- Frontend: HTML, CSS, JavaScript (vanilla)  
- Baza danych: SQLite  
- ORM: SQLAlchemy  
- Konteneryzacja: Docker, Docker Compose  

---

## 🐳 Uruchomienie projektu (Docker)

```bash
docker compose up --build



📁 Struktura projektu
.
├── app/
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   └── database.py
├── static/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── Dockerfile
├── docker-compose.yml
└── README.md
