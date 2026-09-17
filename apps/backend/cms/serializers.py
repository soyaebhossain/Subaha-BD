from rest_framework import serializers

from .models import Banner, Page


class PageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Page
        fields = ("id", "slug", "title_en", "title_bn", "body_en", "body_bn")


class BannerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Banner
        fields = (
            "id",
            "title",
            "subtitle",
            "image_url",
            "cta_label",
            "cta_url",
            "section",
            "sort",
        )

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            url = obj.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return ""
