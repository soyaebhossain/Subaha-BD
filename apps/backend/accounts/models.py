from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from common.models import TimestampedModel


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self) -> str:
        return self.email


class Address(TimestampedModel):
    ZONE_CHOICES = (("dhaka", "Dhaka"), ("outside", "Outside"))

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32)
    line1 = models.CharField(max_length=255)
    area = models.CharField(max_length=128, blank=True)
    city = models.CharField(max_length=128, blank=True)
    zone = models.CharField(max_length=16, choices=ZONE_CHOICES, default="dhaka")

    def __str__(self) -> str:
        return f"{self.name} ({self.zone})"
