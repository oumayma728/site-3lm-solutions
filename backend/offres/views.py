
from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from rest_framework.authentication import TokenAuthentication
from .models import Offre
from .serializers import OffreSerializer


class IsAuthenticatedOrReadOnlyActive(permissions.BasePermission):
    """
    - Anyone can GET (list/retrieve), but only 'actif=True' postings are
    returned to anonymous requests — filtering happens in get_queryset.
    - Only authenticated (admin) users can create/update/delete.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated


class OffreViewSet(viewsets.ModelViewSet):
    serializer_class = OffreSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnlyActive]
    lookup_field = 'slug'

    def get_queryset(self):
        qs = Offre.objects.all()
        if not (self.request.user and self.request.user.is_authenticated):
            qs = qs.filter(actif=True)
        type_offre = self.request.query_params.get('type')
        if type_offre:
            qs = qs.filter(type_offre=type_offre)
        return qs