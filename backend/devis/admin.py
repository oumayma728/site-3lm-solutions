from django.contrib import admin, messages
from .models import (
    Client, Devis, LigneDevis, MultiplicateurComplexite, ParametresTarification, Prestation, RendezVous, TarifProfil,
)


class LigneDevisInline(admin.TabularInline):
    model = LigneDevis
    extra = 0
    # Instantané du calcul : il explique le prix, il ne se saisit pas.
    readonly_fields = ('tjm', 'multiplicateur', 'jours_personne', 'prix')


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prenom', 'entreprise', 'email', 'telephone', 'date_creation')
    search_fields = ('nom', 'entreprise', 'email')


@admin.register(Devis)
class DevisAdmin(admin.ModelAdmin):
    list_display = ('numero', 'client', 'manager', 'statut', 'version', 'estimation_montant', 'date_creation', 'date_validite')
    list_filter = ('statut', 'date_creation')
    search_fields = ('numero', 'client__nom', 'client__entreprise')
    readonly_fields = ('numero', 'version', 'date_validation', 'date_validite', 'ia_modele', 'ia_version_prompt',
                       'ia_reponse_brute', 'budget_mentionne')
    inlines = [LigneDevisInline]


@admin.register(Prestation)
class PrestationAdmin(admin.ModelAdmin):
    list_display = ('nom', 'categorie', 'prix_reference', 'actif')
    list_filter = ('categorie', 'actif')
    search_fields = ('nom', 'description')


@admin.register(RendezVous)
class RendezVousAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'devis', 'date_rdv', 'heure_rdv', 'type_rdv', 'statut')
    list_filter = ('statut', 'type_rdv', 'date_rdv')
    search_fields = ('client__nom', 'client__entreprise')


@admin.register(ParametresTarification)
class ParametresTarificationAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'taux_charges', 'jours_facturables_an', 'frais_generaux_annuels', 'marge', 'taux_marge', 'updated_at')

    def has_add_permission(self, request):
        # Un seul jeu de paramètres (voir ParametresTarification.actuels).
        return not ParametresTarification.objects.exists()

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        # Les TJM dépendent de ces paramètres : on les recalcule aussitôt.
        from .services.pricing import recalculer_tarifs_profils
        recalculer_tarifs_profils()
        messages.info(request, "TJM recalculés avec les nouveaux paramètres.")


@admin.register(TarifProfil)
class TarifProfilAdmin(admin.ModelAdmin):
    list_display = ('profil', 'tjm', 'tjm_plancher', 'tjm_manuel', 'alerte')
    readonly_fields = ('tjm_plancher',)

    @admin.display(description="Alerte")
    def alerte(self, obj):
        return "⚠ Sous le TJM plancher" if obj.sous_plancher else ""

    def _avertir(self, request, tarifs):
        for tarif in tarifs:
            if tarif.sous_plancher:
                messages.warning(
                    request,
                    f"{tarif.get_profil_display()} : TJM {tarif.tjm} TND inférieur au plancher calculé "
                    f"{tarif.tjm_plancher} TND — chaque jour vendu à ce tarif ne couvre pas les coûts et la marge visée.",
                )

    def changelist_view(self, request, extra_context=None):
        self._avertir(request, TarifProfil.objects.all())
        return super().changelist_view(request, extra_context)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        self._avertir(request, [obj])


@admin.register(MultiplicateurComplexite)
class MultiplicateurComplexiteAdmin(admin.ModelAdmin):
    list_display = ('complexite', 'multiplicateur')
