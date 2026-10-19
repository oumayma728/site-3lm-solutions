from django.core.management.base import BaseCommand

from candidature.retention import RETENTION_DAYS, delete_orphan_cv_files, purge_candidatures


class Command(BaseCommand):
    help = (f"Supprime les candidatures (et leur CV) reçues il y a plus de {RETENTION_DAYS} jours, "
            "comme le promet la politique de confidentialité.")

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help="Affiche ce qui serait supprimé, sans rien supprimer.")
        parser.add_argument('--orphans', action='store_true',
                            help="Supprime aussi les fichiers CV qui ne sont plus liés à aucune candidature.")

    def handle(self, *args, dry_run=False, orphans=False, **options):
        verb = 'seraient supprimés' if dry_run else 'supprimés'
        count = purge_candidatures(dry_run=dry_run)
        self.stdout.write(f"Candidatures de plus de {RETENTION_DAYS} jours {verb} : {count}")
        if orphans:
            files = delete_orphan_cv_files(dry_run=dry_run)
            self.stdout.write(f"Fichiers CV orphelins {verb} : {files}")
