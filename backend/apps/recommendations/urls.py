from django.urls import path

from .views import RecommendationsView


urlpatterns = [
    path(
        'recommendations/',
        RecommendationsView.as_view(),
        name='recommendations',
    ),
]