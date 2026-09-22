import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
DEBUG = os.getenv("DEBUG", "1") == "1"
ALLOWED_HOSTS = [value.strip() for value in os.getenv("ALLOWED_HOSTS", "*").split(",") if value.strip()]

INSTALLED_APPS = [
    "common.admin_apps.PlatformAdminConfig",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt",
    "django_filters",
    "corsheaders",
    # Local apps
    "common",
    "marketplace",
    "accounts",
    "catalog",
    "orders",
    "payments",
    "shipping",
    "promotions",
    "cms",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=int(os.getenv("DB_CONN_MAX_AGE", "60")),
        conn_health_checks=True,
    )
}

DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = os.getenv("DB_POOLER_TRANSACTION_MODE", "0") == "1"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Dhaka"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [value for value in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if value]
CSRF_TRUSTED_ORIGINS = [value for value in os.getenv("CSRF_TRUSTED_ORIGINS", "http://localhost:3000").split(",") if value]

REDIS_URL = os.getenv("REDIS_URL")
CACHES = {"default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}} if REDIS_URL else {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = ["rest_framework.throttling.ScopedRateThrottle"]
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {"checkout": os.getenv("CHECKOUT_RATE", "120/min"), "auth": "30/min", "feedback": "10/hour"}
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
# Enable only behind a trusted proxy which overwrites this header.
if os.getenv("TRUST_PROXY", "0") == "1":
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
DATA_UPLOAD_MAX_MEMORY_SIZE = 1024 * 1024
if not DEBUG:
    if len(SECRET_KEY) < 50 or SECRET_KEY == "dev-secret-key":
        raise ImproperlyConfigured("Production requires a random SECRET_KEY of at least 50 characters.")
    if "*" in ALLOWED_HOSTS or not ALLOWED_HOSTS:
        raise ImproperlyConfigured("Production requires explicit ALLOWED_HOSTS.")
    if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":
        raise ImproperlyConfigured("Production marketplace checkout requires PostgreSQL.")
    if not REDIS_URL:
        raise ImproperlyConfigured("Production requires REDIS_URL for shared throttling/cache.")

CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
