# Generated by Django 5.0 on 2024-01-06 13:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('calendar_diary', '0004_alter_event_description_alter_event_end_date_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='images'),
        ),
    ]
