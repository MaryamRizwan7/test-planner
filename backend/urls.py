from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

urlpatterns = [
    path('', lambda request: redirect('/planner/')),
    path('admin/', admin.site.urls),
    path('planner/', include('planner.urls')),
]
