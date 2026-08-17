FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libopenblas0 \
    liblapack3 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    # face-recognition depends on the source-only "dlib" package, but
    # dlib-bin (already installed above) provides the same "dlib" import
    # under a different distribution name. Installing with --no-deps stops
    # pip from also trying to compile the real dlib from source, which
    # previously ran out of memory (>8GB) on Render's build machine.
    && pip install --no-cache-dir --no-deps face-recognition==1.3.0

COPY . .

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD sh -c "python manage.py migrate --noinput && gunicorn core.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"
