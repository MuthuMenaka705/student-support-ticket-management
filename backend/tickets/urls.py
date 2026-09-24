from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    TicketViewSet
)


router = DefaultRouter()

router.register(
    "categories",
    CategoryViewSet,
    basename="category"
)

router.register(
    "tickets",
    TicketViewSet,
    basename="ticket"
)


urlpatterns = [
    path(
        "",
        include(router.urls)
    )
]