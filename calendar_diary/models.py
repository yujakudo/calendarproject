from django.db import models
from imagekit.models import ImageSpecField, ProcessedImageField
from imagekit.processors import ResizeToFill


class Event(models.Model):
    start_date = models.DateTimeField('開始日時')
    end_date = models.DateTimeField('終了日時')
    event_name = models.CharField('タイトル', max_length=200)
    is_allday = models.BooleanField('終日？', default=True)
    event_type = models.CharField('タイプ', max_length=40, blank=True)
    description = models.TextField('詳細', blank=True)

    def __str__(self):
        return self.event_name

class Image(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    image = models.ImageField(upload_to='images',blank=True, null=True)
    thumbnail = ImageSpecField(source='image',
                            processors=[ResizeToFill(250,250)],
                            format="JPEG",
                            options={'quality': 60}
                            )

    def __str__(self):
        return self.event.event_name
