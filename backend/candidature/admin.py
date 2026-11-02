from django.contrib import admin

# Register your models here.

# Register your models here.
from django.contrib import admin
from .models import Candidature, CriteresTri


@admin.register(CriteresTri)
class CriteresTriAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'analyse_auto']




@admin.register(Candidature)
class CandidatureAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'telephone', 'cv', 'message', 'created_at']
    list_filter = ['nom', 'created_at']
    search_fields = ['nom', 'email']
