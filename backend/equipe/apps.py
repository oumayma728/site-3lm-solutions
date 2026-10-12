from django.apps import AppConfig


class EquipeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'equipe'

    def ready(self):
        import equipe.signals  # noqa: F401 — pour que le signal soit enregistré au démarrage de l'app