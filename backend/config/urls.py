from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from django.conf import settings
from django.conf.urls.static import static
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', obtain_auth_token),
    path('api/chat/', include('chat.urls')),
    path('api/', include('devis.urls')),
    path('api/', include('offres.urls')),
    path('api/', include('candidature.urls')),
    path('api/', include('contact.urls')),
    path('api/', include('equipe.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)