
# Register your models here.
from django.contrib import admin
from .models import Offre


@admin.register(Offre)
class OffreAdmin(admin.ModelAdmin):
    list_display = ['titre', 'type_offre', 'programme', 'departement', 'location', 'actif', 'created_at']
    list_filter = ['type_offre', 'programme', 'actif', 'departement']
    search_fields = ['titre', 'description']
    prepopulated_fields = {'slug': ('titre',)}