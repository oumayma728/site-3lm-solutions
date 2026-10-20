# URLs for the Equipe app: employees (pricing profiles) and login accounts

from rest_framework.routers import DefaultRouter
from .comptes import CompteViewSet
from .views import EquipeViewSet

router = DefaultRouter()
router.register(r'equipe', EquipeViewSet, basename='equipe')
router.register(r'comptes', CompteViewSet, basename='comptes')

urlpatterns = router.urls
