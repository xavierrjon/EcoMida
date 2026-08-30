FROM python:3.9-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# gunicorn e o servidor WSGI usado em producao (nao esta no requirements.txt).
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir "gunicorn==21.2.0"

COPY backend/app.py backend/config.py backend/db.py ./
COPY backend/models ./models
COPY backend/routes ./routes
COPY backend/utils ./utils

EXPOSE 5000

# app:create_app() e o padrao de factory do gunicorn.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "60", "app:create_app()"]