from rest_framework import viewsets, permissions
from rest_framework.authentication import TokenAuthentication
from .models import Employe
from .serializers import EmployeSerializer

class LectureTousEcritureSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_superuser)
    
class EquipeViewSet(viewsets.ModelViewSet):
    """Équipe interne : réservé aux utilisateurs connectés, jamais public."""
    queryset = Employe.objects.all()
    serializer_class = EmployeSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [LectureTousEcritureSuperuser]