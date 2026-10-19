#!/bin/sh
# Runs once before each deploy goes live (railway.toml → preDeployCommand).
# If a step fails, the deploy is stopped and the previous version keeps running.
set -e

python manage.py migrate --noinput
python manage.py createcachetable   # rate-limit counters shared by all workers (settings.CACHES)
