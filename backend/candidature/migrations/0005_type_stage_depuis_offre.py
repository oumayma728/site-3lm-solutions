from django.db import migrations


def remplir_type_stage(apps, schema_editor):
    """Renseigne `type_stage` des candidatures existantes à partir du programme de leur offre."""
    Candidature = apps.get_model("candidature", "Candidature")

    for c in Candidature.objects.filter(offre__type_offre="stage").select_related("offre"):
        if c.offre.programme and c.type_stage != c.offre.programme:
            c.type_stage = c.offre.programme
            c.save(update_fields=["type_stage"])


class Migration(migrations.Migration):

    dependencies = [
        ('candidature', '0004_lier_offre_depuis_reference'),
    ]

    operations = [
        migrations.RunPython(remplir_type_stage, migrations.RunPython.noop),
    ]
