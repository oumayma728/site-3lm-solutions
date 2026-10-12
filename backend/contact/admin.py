
# Register your models here.
from django.contrib import admin

# Register your models here.

# Register your models here.
from django.contrib import admin
from .models import Contact





@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['nom', 'email', 'sujet', 'message', 'created_at']
    list_filter = ['nom', 'created_at']
    search_fields = ['nom', 'email']
