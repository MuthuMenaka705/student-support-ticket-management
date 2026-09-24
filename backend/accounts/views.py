from django.shortcuts import render

# Create your views here.
from django.contrib.auth.models import User

from rest_framework import (
    generics,
    permissions
)

from .serializers import UserSerializer


class CurrentUserView(
    generics.RetrieveAPIView
):

    serializer_class = UserSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_object(self):

        return self.request.user


class StaffListView(
    generics.ListAPIView
):

    serializer_class = UserSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        return (
            User.objects
            .filter(is_staff=True)
            .order_by("username")
        )