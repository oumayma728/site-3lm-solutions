"""Daily retention purge, run inside the web service.

Why not a separate cron service: on Railway a volume (where the CVs live) can be attached to one
service only, so only the web service can delete CV files.

Enabled with PURGE_SCHEDULER=true. Every gunicorn worker starts this thread, but a PostgreSQL
advisory lock lets only one of them run the purge; the others skip that round.
"""
import logging
import os
import threading
import time

from django.db import close_old_connections, connection

logger = logging.getLogger(__name__)

FIRST_RUN_DELAY = 10 * 60      # seconds after start: never during a deploy's warm-up
INTERVAL = 24 * 60 * 60        # then once a day
LOCK_ID = 873_120_001          # any constant, unique to this job

_started = False


def run_once() -> None:
    close_old_connections()
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT pg_try_advisory_lock(%s)', [LOCK_ID])
            if not cursor.fetchone()[0]:
                return  # another worker is purging right now
            try:
                from .retention import delete_orphan_cv_files, purge_candidatures
                purge_candidatures()
                delete_orphan_cv_files()
            finally:
                cursor.execute('SELECT pg_advisory_unlock(%s)', [LOCK_ID])
    except Exception:  # never kill the thread: retry tomorrow
        logger.exception('Retention purge failed')
    finally:
        close_old_connections()


def _loop() -> None:
    time.sleep(FIRST_RUN_DELAY)
    while True:
        run_once()
        time.sleep(INTERVAL)


def start() -> None:
    global _started
    if _started or os.getenv('PURGE_SCHEDULER', 'false').lower() != 'true':
        return
    _started = True
    threading.Thread(target=_loop, name='candidature-retention', daemon=True).start()
