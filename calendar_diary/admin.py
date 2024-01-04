from django.contrib import admin

from .models import Event

# Register your models here.

class EventAdmin(admin.ModelAdmin):
    fieldsets = [
        ('基本情報', {'fields': ("event_name", "event_type", )}),
        ('期間', {'fields': ("is_allday", ("start_date", "end_date", ), )}),
        ('詳細', {'fields': ("description",)}),
    ]
    list_display = ["event_name", "event_type", "start_date", "end_date"]

admin.site.register(Event, EventAdmin)
