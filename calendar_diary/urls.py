from django.urls import path
from . import views

app_name = "cal"
urlpatterns = [
    path("", views.index, name="index"),
    path("sc/list/", views.get_event_list, name="get_event_list"),
    path("sc/save/", views.save_event, name="save_event"),
]