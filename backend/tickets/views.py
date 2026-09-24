from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Q, Avg
from django.utils import timezone

from rest_framework import (
    viewsets,
    permissions,
    status
)

from rest_framework.decorators import action

from rest_framework.response import Response

from .models import (
    Category,
    Ticket,
    Comment,
    ActivityLog
)

from .serializers import (
    CategorySerializer,
    TicketSerializer,
    CommentSerializer
)


def is_staff_user(user):
    return user.is_authenticated and user.is_staff


def is_manager(user):
    return (
        user.is_authenticated
        and user.is_superuser
    )


def get_sla_hours(priority):

    values = {
        "LOW": 72,
        "MEDIUM": 48,
        "HIGH": 24,
        "URGENT": 8,
    }

    return values.get(priority, 48)


class CategoryViewSet(viewsets.ModelViewSet):

    queryset = Category.objects.all().order_by("name")

    serializer_class = CategorySerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def create(self, request, *args, **kwargs):

        if not is_manager(request.user):
            return Response(
                {
                    "error": "Only manager can create categories."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        return super().create(
            request,
            *args,
            **kwargs
        )

    def destroy(self, request, *args, **kwargs):

        if not is_manager(request.user):
            return Response(
                {
                    "error": "Only manager can delete categories."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        return super().destroy(
            request,
            *args,
            **kwargs
        )


class TicketViewSet(viewsets.ModelViewSet):

    serializer_class = TicketSerializer

    permission_classes = [
        permissions.IsAuthenticated
    ]

    def get_queryset(self):

        user = self.request.user

        queryset = (
            Ticket.objects
            .select_related(
                "student",
                "assigned_to",
                "category"
            )
            .prefetch_related(
                "comments",
                "activities"
            )
            .order_by("-created_at")
        )

        if not user.is_staff:

            queryset = queryset.filter(
                student=user
            )

        params = self.request.query_params

        search = params.get("search")

        if search:

            queryset = queryset.filter(
                Q(title__icontains=search)
                |
                Q(description__icontains=search)
                |
                Q(student__username__icontains=search)
            )

        status_filter = params.get("status")

        if status_filter:

            queryset = queryset.filter(
                status=status_filter
            )

        priority = params.get("priority")

        if priority:

            queryset = queryset.filter(
                priority=priority
            )

        category = params.get("category")

        if category:

            queryset = queryset.filter(
                category_id=category
            )

        assigned_to = params.get("assigned_to")

        if assigned_to:

            queryset = queryset.filter(
                assigned_to_id=assigned_to
            )

        escalated = params.get("escalated")

        if escalated == "true":

            queryset = queryset.filter(
                escalated=True
            )

        overdue = params.get("overdue")

        if overdue == "true":

            queryset = queryset.filter(
                due_at__lt=timezone.now()
            ).exclude(
                status__in=[
                    "RESOLVED",
                    "CLOSED"
                ]
            )

        return queryset

    def perform_create(self, serializer):

        priority = self.request.data.get(
            "priority",
            "MEDIUM"
        )

        if priority not in [
            "LOW",
            "MEDIUM",
            "HIGH",
            "URGENT"
        ]:
            priority = "MEDIUM"

        sla_hours = get_sla_hours(
            priority
        )

        due_at = (
            timezone.now()
            +
            timedelta(hours=sla_hours)
        )

        ticket = serializer.save(
            student=self.request.user,
            priority=priority,
            due_at=due_at
        )

        ActivityLog.objects.create(
            ticket=ticket,
            user=self.request.user,
            action="Ticket Created",
            new_value=(
                f"Priority: {priority}; "
                f"SLA: {sla_hours} hours"
            )
        )

    @action(
        detail=True,
        methods=["post"]
    )
    def assign(self, request, pk=None):

        if not is_staff_user(request.user):

            return Response(
                {
                    "error": "Only staff can assign tickets."
                },
                status=403
            )

        ticket = self.get_object()

        staff_id = request.data.get(
            "assigned_to"
        )

        try:

            staff = User.objects.get(
                id=staff_id,
                is_staff=True
            )

        except (
            User.DoesNotExist,
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "error": "Valid staff user is required."
                },
                status=400
            )

        old_value = (
            ticket.assigned_to.username
            if ticket.assigned_to
            else "Unassigned"
        )

        ticket.assigned_to = staff

        if ticket.status == "OPEN":

            ticket.status = "ASSIGNED"

        ticket.save()

        ActivityLog.objects.create(
            ticket=ticket,
            user=request.user,
            action="Ticket Assigned",
            old_value=old_value,
            new_value=staff.username
        )

        return Response(
            TicketSerializer(ticket).data
        )

    @action(
        detail=True,
        methods=["post"]
    )
    def update_status(self, request, pk=None):

        ticket = self.get_object()

        if not is_staff_user(request.user):

            return Response(
                {
                    "error": "Only staff can update ticket status."
                },
                status=403
            )

        new_status = request.data.get(
            "status"
        )

        valid_statuses = {
            choice[0]
            for choice in Ticket.STATUS_CHOICES
        }

        if new_status not in valid_statuses:

            return Response(
                {
                    "error": "Invalid status."
                },
                status=400
            )

        old_status = ticket.status

        ticket.status = new_status

        if new_status == "PENDING":

            ticket.pending_reason = (
                request.data.get(
                    "pending_reason",
                    ticket.pending_reason
                )
            )

        if new_status == "RESOLVED":

            resolution = (
                request.data.get(
                    "resolution",
                    ""
                ).strip()
            )

            if not resolution:

                return Response(
                    {
                        "error":
                        "Resolution is required."
                    },
                    status=400
                )

            ticket.resolution = resolution

            ticket.pending_reason = ""

        if new_status == "CLOSED":

            if not ticket.resolution:

                return Response(
                    {
                        "error":
                        "Ticket must have a resolution before closing."
                    },
                    status=400
                )

            ticket.closed_at = (
                timezone.now()
            )

        if new_status not in [
            "PENDING"
        ]:

            if new_status != "CLOSED":

                ticket.pending_reason = ""

        ticket.save()

        ActivityLog.objects.create(
            ticket=ticket,
            user=request.user,
            action="Status Changed",
            old_value=old_status,
            new_value=new_status
        )

        return Response(
            TicketSerializer(ticket).data
        )

    @action(
        detail=True,
        methods=["post"]
    )
    def comment(self, request, pk=None):

        ticket = self.get_object()

        message = (
            request.data.get(
                "message",
                ""
            )
            .strip()
        )

        if not message:

            return Response(
                {
                    "error": "Message is required."
                },
                status=400
            )

        comment = Comment.objects.create(
            ticket=ticket,
            user=request.user,
            message=message
        )

        ActivityLog.objects.create(
            ticket=ticket,
            user=request.user,
            action="Comment Added",
            new_value=message
        )

        return Response(
            CommentSerializer(comment).data,
            status=201
        )

    @action(
        detail=True,
        methods=["post"]
    )
    def escalate(self, request, pk=None):

        if not is_staff_user(request.user):

            return Response(
                {
                    "error":
                    "Only staff can escalate tickets."
                },
                status=403
            )

        ticket = self.get_object()

        if ticket.status in [
            "RESOLVED",
            "CLOSED"
        ]:

            return Response(
                {
                    "error":
                    "Resolved or closed tickets cannot be escalated."
                },
                status=400
            )

        ticket.escalated = True

        ticket.escalated_at = timezone.now()

        ticket.save()

        ActivityLog.objects.create(
            ticket=ticket,
            user=request.user,
            action="Ticket Escalated",
            new_value="Escalated to management"
        )

        return Response(
            TicketSerializer(ticket).data
        )

    @action(
        detail=True,
        methods=["post"]
    )
    def reopen(self, request, pk=None):

        ticket = self.get_object()

        allowed = (
            request.user.is_staff
            or ticket.student_id == request.user.id
        )

        if not allowed:

            return Response(
                {
                    "error": "Not allowed."
                },
                status=403
            )

        if ticket.status not in [
            "RESOLVED",
            "CLOSED"
        ]:

            return Response(
                {
                    "error":
                    "Only resolved or closed tickets can be reopened."
                },
                status=400
            )

        old_status = ticket.status

        ticket.status = "OPEN"

        ticket.closed_at = None

        ticket.resolution = ""

        ticket.due_at = (
            timezone.now()
            +
            timedelta(
                hours=get_sla_hours(
                    ticket.priority
                )
            )
        )

        ticket.save()

        ActivityLog.objects.create(
            ticket=ticket,
            user=request.user,
            action="Ticket Reopened",
            old_value=old_status,
            new_value="OPEN"
        )

        return Response(
            TicketSerializer(ticket).data
        )

    @action(
        detail=False,
        methods=["get"]
    )
    def dashboard(self, request):

        if not is_staff_user(request.user):

            return Response(
                {
                    "error":
                    "Only staff or manager can access dashboard."
                },
                status=403
            )

        now = timezone.now()

        queryset = Ticket.objects.all()

        total = queryset.count()

        resolved = queryset.filter(
            status="RESOLVED"
        ).count()

        closed = queryset.filter(
            status="CLOSED"
        ).count()

        active = queryset.exclude(
            status__in=[
                "RESOLVED",
                "CLOSED"
            ]
        ).count()

        overdue = queryset.filter(
            due_at__lt=now
        ).exclude(
            status__in=[
                "RESOLVED",
                "CLOSED"
            ]
        ).count()

        urgent = queryset.filter(
            priority="URGENT"
        ).exclude(
            status__in=[
                "RESOLVED",
                "CLOSED"
            ]
        ).count()

        escalated = queryset.filter(
            escalated=True
        ).exclude(
            status__in=[
                "RESOLVED",
                "CLOSED"
            ]
        ).count()

        by_status = list(
            queryset
            .values("status")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        by_priority = list(
            queryset
            .values("priority")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        by_category = list(
            queryset
            .values(
                "category__name"
            )
            .annotate(
                count=Count("id")
            )
            .order_by("-count")
        )

        by_staff = list(
            queryset
            .filter(
                assigned_to__isnull=False
            )
            .values(
                "assigned_to__username"
            )
            .annotate(
                count=Count("id")
            )
            .order_by("-count")
        )

        return Response(
            {
                "total": total,

                "active": active,

                "open": queryset.filter(
                    status="OPEN"
                ).count(),

                "assigned": queryset.filter(
                    status="ASSIGNED"
                ).count(),

                "in_progress": queryset.filter(
                    status="IN_PROGRESS"
                ).count(),

                "pending": queryset.filter(
                    status="PENDING"
                ).count(),

                "resolved": resolved,

                "closed": closed,

                "overdue": overdue,

                "urgent": urgent,

                "escalated": escalated,

                "by_status": by_status,

                "by_priority": by_priority,

                "by_category": by_category,

                "by_staff": by_staff,
            }
        )