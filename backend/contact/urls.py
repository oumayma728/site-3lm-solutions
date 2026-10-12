# URLs for the Offre app

from rest_framework.routers import DefaultRouter
from .views import ContactViewSet

router = DefaultRouter()
router.register(r'contact', ContactViewSet, basename='contact')

urlpatterns = router.urls