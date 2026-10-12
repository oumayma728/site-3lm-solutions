# URLs for the Offre app

from rest_framework.routers import DefaultRouter
from .views import EquipeViewSet

router = DefaultRouter()
router.register(r'equipe', EquipeViewSet, basename='equipe')

urlpatterns = router.urls