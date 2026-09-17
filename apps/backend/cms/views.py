from rest_framework import permissions, viewsets

from .models import Banner, Page
from .serializers import BannerSerializer, PageSerializer


class PageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Page.objects.filter(is_active=True)
    serializer_class = PageSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class BannerViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BannerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        section = self.request.query_params.get("section")
        qs = Banner.objects.filter(is_active=True)
        if section:
            qs = qs.filter(section=section)
        return qs.order_by("sort", "-created_at")
