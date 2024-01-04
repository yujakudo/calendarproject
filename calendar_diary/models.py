from django.db import models

# Create your models here.


class Event(models.Model):
    start_date = models.DateTimeField('開始日時')
    end_date = models.DateTimeField('終了日時')
    event_name = models.CharField('タイトル', max_length=200)
    is_allday = models.BooleanField('終日？', default=True)
    event_type = models.CharField('タイプ', max_length=40, blank=True)
    description = models.TextField('詳細', blank=True)

    def __str__(self):
        return self.event_name
