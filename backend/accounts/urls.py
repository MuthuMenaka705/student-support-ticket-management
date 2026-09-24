from django.urls import path

from .views import (
    CurrentUserView,
    StaffListView
)


urlpatterns = [

    path(
        "me/",
        CurrentUserView.as_view()
    ),

    path(
        "staff/",
        StaffListView.as_view()
    ),

]