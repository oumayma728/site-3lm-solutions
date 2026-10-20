FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# System libraries WeasyPrint needs to render the PDF quotes (devis/services/pdf.py)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0 fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect the static files (Django admin CSS) into the image; WhiteNoise serves them.
# The placeholder key is only for this build step: the real SECRET_KEY comes from the host at runtime.
RUN SECRET_KEY=collectstatic-only python manage.py collectstatic --noinput

EXPOSE 8000
# The host gives the port in $PORT. WEB_CONCURRENCY = number of worker processes.
# predeploy.sh (migrations + cache table) also runs here, so the database is always ready even when
# the host skips railway.toml's preDeployCommand. Both steps are idempotent; if one fails, the
# container does not start and the previous deploy keeps serving.
CMD ["sh", "-c", "sh predeploy.sh && exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-3} --timeout 60 --access-logfile -"]
