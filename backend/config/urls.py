from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.throttling import ScopedRateThrottle


class ThrottledObtainAuthToken(ObtainAuthToken):
    """Token login limited per IP (see DEFAULT_THROTTLE_RATES['login'] in settings)."""
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'login'


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', ThrottledObtainAuthToken.as_view()),
    path('api/chat/', include('chat.urls')),
    path('api/', include('devis.urls')),
    path('api/', include('offres.urls')),
    path('api/', include('candidature.urls')),
    path('api/', include('contact.urls')),
    path('api/', include('equipe.urls')),
]
# /media/ is deliberately NOT served: it holds candidates' CVs (personal data).
# CVs are downloaded only through the authenticated GET /api/candidature/<id>/cv/.