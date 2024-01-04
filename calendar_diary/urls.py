from django.urls import path
from . import views

app_name = "cal"
urlpatterns = [
    path("", views.index, name="index"),
    path("sc/add/", views.add_event, name="add_event"),
    path("sc/list/", views.get_events, name="get_events"),
    path("sc/form/", views.event_form, name="event_form"),
]