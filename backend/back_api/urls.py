from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.programs.urls')),
    path('api/', include('apps.admissions.urls')),
    path('api/', include('apps.imports.urls')),
    path('api/', include('apps.calculations.urls')),
    path('api/', include('apps.recommendations.urls')),
]