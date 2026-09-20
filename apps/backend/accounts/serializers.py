from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Address

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "name")
        read_only_fields = ("id",)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "name", "password")

    def validate(self, attrs):
        try:
            validate_password(attrs["password"], User(email=attrs["email"], name=attrs.get("name", "")))
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": error.messages})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = (
            "id",
            "name",
            "phone",
            "line1",
            "area",
            "city",
            "zone",
            "created_at",
        )
        read_only_fields = ("id", "created_at")
