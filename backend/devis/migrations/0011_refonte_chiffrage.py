"""Refonte du chiffrage des devis.

- LigneDevis.jours_estimes -> jours_par_personne (renommage, données conservées)
  + instantané du calcul (tjm, multiplicateur, jours_personne, prix)
- Devis : hypothèses, questions ouvertes, budget mentionné, traçabilité IA,
  numéro, version, dates de validation / validité
- ParametresTarification : nouvelle formule du TJM ; marge_beneficiaire ->
  taux_marge (marge sur le prix) ; charge_patronale / taux_utilisation supprimés
  (remplacés par taux_charges / jours_facturables_an)
- TarifProfil.tjm_plancher
- Multiplicateurs de complexité en base (valeurs reprises de l'ancien code)
"""
from decimal import Decimal

import django.core.validators
from django.db import migrations, models

ANCIENS_MULTIPLICATEURS = {'simple': Decimal('1.00'), 'moyenne': Decimal('1.15'), 'complexe': Decimal('1.35')}


def creer_multiplicateurs(apps, schema_editor):
    Multiplicateur = apps.get_model('devis', 'MultiplicateurComplexite')
    for complexite, valeur in ANCIENS_MULTIPLICATEURS.items():
        Multiplicateur.objects.get_or_create(complexite=complexite, defaults={'multiplicateur': valeur})


def numeroter_devis_existants(apps, schema_editor):
    Devis = apps.get_model('devis', 'Devis')
    for devis in Devis.objects.filter(numero__isnull=True):
        devis.numero = f"DEV-{devis.date_creation:%Y}-{devis.pk:05d}"
        devis.save(update_fields=['numero'])


class Migration(migrations.Migration):

    dependencies = [
        ('devis', '0010_devis_cout_reel_devis_mode_tarification_and_more'),
    ]

    operations = [
        # --- LigneDevis ---
        migrations.RenameField('lignedevis', 'jours_estimes', 'jours_par_personne'),
        migrations.AlterField(
            model_name='lignedevis', name='jours_par_personne',
            field=models.DecimalField(blank=True, decimal_places=1, max_digits=6, null=True,
                                      validators=[django.core.validators.MinValueValidator(Decimal('0.1'))]),
        ),
        migrations.AlterField(
            model_name='lignedevis', name='prix_unitaire',
            field=models.DecimalField(decimal_places=2, max_digits=10,
                                      validators=[django.core.validators.MinValueValidator(Decimal('0'))]),
        ),
        migrations.AddField('lignedevis', 'tjm', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
        migrations.AddField('lignedevis', 'multiplicateur', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
        migrations.AddField('lignedevis', 'jours_personne', models.DecimalField(blank=True, decimal_places=1, max_digits=8, null=True)),
        migrations.AddField('lignedevis', 'prix', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),

        # --- Devis ---
        migrations.AlterField(
            model_name='devis', name='cout_reel',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True,
                                      validators=[django.core.validators.MinValueValidator(Decimal('0'))],
                                      help_text="Coût réel total payé par l'admin (salaires, charges, déploiement, impôts...) — mode 'cout_reel' uniquement."),
        ),
        migrations.AddField('devis', 'hypotheses', models.JSONField(blank=True, default=list)),
        migrations.AddField('devis', 'questions_ouvertes', models.JSONField(blank=True, default=list)),
        migrations.AddField('devis', 'budget_mentionne', models.JSONField(blank=True, null=True)),
        migrations.AddField('devis', 'ia_reponse_brute', models.JSONField(blank=True, null=True)),
        migrations.AddField('devis', 'ia_modele', models.CharField(blank=True, max_length=100)),
        migrations.AddField('devis', 'ia_version_prompt', models.CharField(blank=True, max_length=40)),
        migrations.AddField('devis', 'numero', models.CharField(
            blank=True, max_length=20, null=True, unique=True,
            help_text='Numéro affiché au client, ex. DEV-2026-00042 (attribué à la création).')),
        migrations.AddField('devis', 'version', models.PositiveIntegerField(default=1)),
        migrations.AddField('devis', 'date_validation', models.DateTimeField(blank=True, null=True)),
        migrations.AddField('devis', 'date_validite', models.DateField(
            blank=True, null=True, help_text="Date limite de l'offre (30 jours après validation).")),
        migrations.RunPython(numeroter_devis_existants, migrations.RunPython.noop),

        # --- ParametresTarification ---
        migrations.RenameField('parametrestarification', 'marge_beneficiaire', 'taux_marge'),
        migrations.AlterField(
            model_name='parametrestarification', name='taux_marge',
            field=models.DecimalField(
                decimal_places=4, default=Decimal('0.30'), max_digits=5,
                validators=[django.core.validators.MinValueValidator(Decimal('0')),
                            django.core.validators.MaxValueValidator(Decimal('0.95'))],
                help_text="Mode 'coût réel' : part du prix de vente qui est de la marge (0.30 = 30 % du prix). "
                          "Saisir une fraction, pas un pourcentage."),
        ),
        migrations.RemoveField('parametrestarification', 'charge_patronale'),
        migrations.RemoveField('parametrestarification', 'taux_utilisation'),
        migrations.AddField('parametrestarification', 'taux_charges', models.DecimalField(
            decimal_places=4, default=Decimal('0.1857'), max_digits=5,
            validators=[django.core.validators.MinValueValidator(Decimal('0')),
                        django.core.validators.MaxValueValidator(Decimal('1'))],
            help_text='Charges patronales en fraction du salaire brut (0.1857 = 18,57 %).')),
        migrations.AddField('parametrestarification', 'jours_facturables_an', models.PositiveIntegerField(
            default=165, validators=[django.core.validators.MinValueValidator(1),
                                     django.core.validators.MaxValueValidator(366)],
            help_text='Jours réellement facturables par personne et par an (hors congés, formation, avant-vente…).')),
        migrations.AddField('parametrestarification', 'frais_generaux_annuels', models.DecimalField(
            decimal_places=2, default=Decimal('0'), max_digits=12,
            validators=[django.core.validators.MinValueValidator(Decimal('0'))],
            help_text='Frais fixes annuels (loyer, logiciels, comptable…), en TND, répartis entre les profils facturables.')),
        migrations.AddField('parametrestarification', 'marge', models.DecimalField(
            decimal_places=4, default=Decimal('0.60'), max_digits=5,
            validators=[django.core.validators.MinValueValidator(Decimal('0')),
                        django.core.validators.MaxValueValidator(Decimal('5'))],
            help_text='Marge appliquée au coût pour obtenir le TJM (0.60 = +60 %).')),
        migrations.AlterModelOptions('parametrestarification', options={
            'verbose_name': 'Paramètres de tarification', 'verbose_name_plural': 'Paramètres de tarification'}),

        # --- TarifProfil ---
        migrations.AlterField(
            model_name='tarifprofil', name='profil',
            field=models.CharField(choices=[('junior', 'Junior'), ('senior', 'Senior'), ('chef_de_projet', 'Chef de projet')],
                                   max_length=20, unique=True),
        ),
        migrations.AddField('tarifprofil', 'tjm_plancher', models.DecimalField(
            blank=True, decimal_places=2, max_digits=10, null=True,
            help_text='TJM calculé à partir des salaires (recalculé automatiquement).')),

        # --- Multiplicateurs de complexité ---
        migrations.CreateModel(
            name='MultiplicateurComplexite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('complexite', models.CharField(choices=[('simple', 'Simple'), ('moyenne', 'Moyenne'), ('complexe', 'Complexe')],
                                                max_length=10, unique=True)),
                ('multiplicateur', models.DecimalField(decimal_places=2, max_digits=5, validators=[
                    django.core.validators.MinValueValidator(Decimal('0.1')),
                    django.core.validators.MaxValueValidator(Decimal('10'))])),
            ],
            options={'verbose_name': 'Multiplicateur de complexité',
                     'verbose_name_plural': 'Multiplicateurs de complexité'},
        ),
        migrations.RunPython(creer_multiplicateurs, migrations.RunPython.noop),
    ]
