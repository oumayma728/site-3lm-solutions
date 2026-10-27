from django.contrib import admin
from django.contrib.auth import get_user_model
from django.urls import path, include
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.throttling import ScopedRateThrottle


class LoginSerializer(AuthTokenSerializer):
    """Accept the username in any letter case, or the account's e-mail address.

    Usernames are case-sensitive in Django ("Sarra" ≠ "sarra"), and the accounts page asks for
    both a username and an e-mail, so people naturally log in with either. The password check is
    unchanged (Django's authenticate)."""

    def validate(self, attrs):
        saisi = (attrs.get('username') or '').strip()
        users = get_user_model().objects
        compte = (
            users.filter(username=saisi).first()
            or users.filter(username__iexact=saisi).first()
            or (users.filter(email__iexact=saisi).first()
                if '@' in saisi and users.filter(email__iexact=saisi).count() == 1 else None)
        )
        attrs['username'] = compte.username if compte else saisi
        return super().validate(attrs)


class ThrottledObtainAuthToken(ObtainAuthToken):
    """Token login limited per IP (see DEFAULT_THROTTLE_RATES['login'] in settings)."""
    serializer_class = LoginSerializer
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