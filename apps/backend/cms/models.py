from django.db import models

from common.models import TimestampedModel


class Page(TimestampedModel):
    slug = models.SlugField(unique=True)
    title_bn = models.CharField(max_length=255, blank=True)
    title_en = models.CharField(max_length=255)
    body_bn = models.TextField(blank=True)
    body_en = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.slug


class Banner(TimestampedModel):
    SECTION_CHOICES = (
        ("hero", "Hero"),
        ("flash", "Flash"),
        ("promo", "Promo"),
    )

    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    image = models.ImageField(upload_to="banners/")
    cta_label = models.CharField(max_length=128, blank=True)
    cta_url = models.URLField(blank=True)
    section = models.CharField(max_length=32, choices=SECTION_CHOICES, default="hero")
    is_active = models.BooleanField(default=True)
    sort = models.IntegerField(default=0)

    class Meta:
        ordering = ("sort", "-created_at")

    def __str__(self) -> str:
        return f"{self.section}: {self.title}"
