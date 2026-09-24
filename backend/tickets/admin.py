from django.contrib import admin

from .models import (
    Category,
    Ticket,
    Comment,
    ActivityLog
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "name"
    ]

    search_fields = [
        "name"
    ]


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "title",
        "student",
        "assigned_to",
        "category",
        "priority",
        "status",
        "escalated",
        "due_at",
        "created_at",
    ]

    list_filter = [
        "status",
        "priority",
        "escalated",
        "category",
    ]

    search_fields = [
        "title",
        "description",
        "student__username",
    ]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "ticket",
        "user",
        "created_at"
    ]


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):

    list_display = [
        "id",
        "ticket",
        "user",
        "action",
        "created_at"
    ]