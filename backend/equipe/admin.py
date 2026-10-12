
# Register your models here.
from django.contrib import admin

from django.contrib import admin
from .models import Employe

@admin.register(Employe)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['nom', 'prenom', 'poste', 'profil', 'created_at']
    list_filter = ['nom', 'created_at']
    search_fields = ['nom', 'prenom']
