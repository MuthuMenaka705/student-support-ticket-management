from django.utils import timezone
from rest_framework import serializers

from .models import (
    Category,
    Ticket,
    Comment,
    ActivityLog
)


class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
        ]


class CommentSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = Comment

        fields = [
            "id",
            "user",
            "user_name",
            "message",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "user_name",
            "created_at",
        ]


class ActivityLogSerializer(serializers.ModelSerializer):

    user_name = serializers.CharField(
        source="user.username",
        read_only=True
    )

    class Meta:
        model = ActivityLog

        fields = [
            "id",
            "user",
            "user_name",
            "action",
            "old_value",
            "new_value",
            "created_at",
        ]


class TicketSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.username",
        read_only=True
    )

    assigned_to_name = serializers.CharField(
        source="assigned_to.username",
        read_only=True,
        allow_null=True
    )

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
        allow_null=True
    )

    comments = CommentSerializer(
        many=True,
        read_only=True
    )

    activities = ActivityLogSerializer(
        many=True,
        read_only=True
    )

    is_overdue = serializers.SerializerMethodField()

    ageing_hours = serializers.SerializerMethodField()

    ageing_label = serializers.SerializerMethodField()

    class Meta:

        model = Ticket

        fields = [
            "id",

            "student",
            "student_name",

            "assigned_to",
            "assigned_to_name",

            "category",
            "category_name",

            "title",
            "description",

            "status",
            "priority",

            "resolution",
            "pending_reason",

            "due_at",

            "escalated",
            "escalated_at",

            "closed_at",

            "created_at",
            "updated_at",

            "is_overdue",
            "ageing_hours",
            "ageing_label",

            "comments",
            "activities",
        ]

        read_only_fields = [
            "id",
            "student",
            "student_name",
            "assigned_to_name",
            "category_name",
            "due_at",
            "escalated",
            "escalated_at",
            "closed_at",
            "created_at",
            "updated_at",
            "is_overdue",
            "ageing_hours",
            "ageing_label",
            "comments",
            "activities",
        ]

    def get_is_overdue(self, obj):

        if not obj.due_at:
            return False

        return (
            obj.due_at < timezone.now()
            and obj.status not in ["RESOLVED", "CLOSED"]
        )

    def get_ageing_hours(self, obj):

        end_time = obj.closed_at or timezone.now()

        seconds = (
            end_time - obj.created_at
        ).total_seconds()

        return round(
            max(seconds, 0) / 3600,
            2
        )

    def get_ageing_label(self, obj):

        hours = self.get_ageing_hours(obj)

        if hours < 24:
            return f"{hours:.1f} hours"

        days = hours / 24

        return f"{days:.1f} days"