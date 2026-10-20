"""Login accounts of the team (the people who sign in to the admin), managed from the site.

Only superusers ("Administrateur") can list, create or change accounts. Accounts are never deleted
(quotes keep a link to their author): they are deactivated instead, which also ends their sessions.
"""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import permissions, serializers, viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.response import Response

User = get_user_model()


class EstSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class CompteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False,
                                     style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email',
                  'is_superuser', 'is_active', 'last_login', 'date_joined', 'password']
        read_only_fields = ['last_login', 'date_joined']
        extra_kwargs = {'username': {'validators': []}}  # checked below, case-insensitive, in French

    def validate_username(self, value):
        value = value.strip()
        existe = User.objects.filter(username__iexact=value)
        if self.instance:
            existe = existe.exclude(pk=self.instance.pk)
        if existe.exists():
            raise serializers.ValidationError("Cet identifiant est déjà utilisé.")
        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, data):
        password = data.get('password')
        if not self.instance and not password:
            raise serializers.ValidationError({'password': "Le mot de passe est obligatoire."})
        if password:
            # Same rules as Django (length, too common, too close to the name…)
            candidat = self.instance or User(username=data.get('username', ''), email=data.get('email', ''),
                                             first_name=data.get('first_name', ''), last_name=data.get('last_name', ''))
            try:
                validate_password(password, user=candidat)
            except Exception as exc:
                raise serializers.ValidationError({'password': list(getattr(exc, 'messages', [str(exc)]))})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Always active at creation (an omitted checkbox in form data would otherwise read as False)
        validated_data['is_active'] = True
        user = User(**validated_data)
        user.is_staff = user.is_superuser  # the Django /admin/ back-office stays for administrators only
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for champ, valeur in validated_data.items():
            setattr(instance, champ, valeur)
        instance.is_staff = instance.is_superuser
        if password:
            instance.set_password(password)
        instance.save()
        # New password or deactivated account: end every open session of that person
        if password or not instance.is_active:
            Token.objects.filter(user=instance).delete()
        return instance


class CompteViewSet(viewsets.ModelViewSet):
    serializer_class = CompteSerializer
    authentication_classes = [TokenAuthentication]
    queryset = User.objects.order_by('-is_active', '-is_superuser', 'username')
    http_method_names = ['get', 'post', 'patch', 'head', 'options']  # no DELETE: deactivate instead

    def get_permissions(self):
        if self.action == 'moi':
            return [permissions.IsAuthenticated()]
        return [EstSuperuser()]

    def perform_update(self, serializer):
        # Never lock yourself out: this also guarantees at least one active administrator remains
        if serializer.instance.pk == self.request.user.pk:
            if serializer.validated_data.get('is_active') is False:
                raise serializers.ValidationError({'is_active': "Vous ne pouvez pas désactiver votre propre compte."})
            if serializer.validated_data.get('is_superuser') is False:
                raise serializers.ValidationError({'is_superuser': "Vous ne pouvez pas retirer vos propres droits d’administrateur."})
        serializer.save()

    @action(detail=False, methods=['get'])
    def moi(self, request):
        """The signed-in account: lets the admin UI show the accounts section to administrators only."""
        u = request.user
        return Response({'id': u.id, 'username': u.username, 'first_name': u.first_name,
                         'last_name': u.last_name, 'is_superuser': u.is_superuser})
