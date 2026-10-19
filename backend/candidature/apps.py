from django.apps import AppConfig


class CandidatureConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'candidature'

    def ready(self):
        from . import signals  # noqa: F401  delete the CV file with its application
        from . import scheduler
        scheduler.start()       # daily 6-month purge, only when PURGE_SCHEDULER=true (production)
