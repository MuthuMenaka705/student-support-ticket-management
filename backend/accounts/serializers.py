from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):

    role = serializers.SerializerMethodField()

    class Meta:

        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "role",
        ]

    def get_role(self, obj):

        if obj.is_superuser:
            return "MANAGER"

        if obj.is_staff:
            return "STAFF"

        return "STUDENT"