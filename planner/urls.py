from django.urls import path
from . import views

urlpatterns = [
    path('run/', views.run_planner, name='run_planner'),
    path("preview_venue_plan/", views.preview_venue_plan, name="preview_venue_plan"),
    path("download_venue_plan/", views.download_venue_plan, name="download_venue_plan"),
    path("get_csrf_token/", views.get_csrf_token, name="get_csrf_token"),
]