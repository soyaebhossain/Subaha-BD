from rest_framework.pagination import PageNumberPagination, CursorPagination


class CatalogPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "page_size"
    max_page_size = 100


class OperationsPagination(CursorPagination):
    page_size = 30
    ordering = ("-created_at", "-id")
