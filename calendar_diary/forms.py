from django import forms
from .models import Event

# イベントの種別の選択肢
event_type_choices = (
    ('event', 'イベント'),
    ('diary', '日記'),
    # ('image', '画像'),
)

# イベントのフォーム
class EventForm(forms.Form):
    # イベントのID
    event_id = forms.IntegerField(
        required=True,
        initial="0",
        widget=forms.HiddenInput
    )
    # イベントのタイプ
    event_type = forms.fields.ChoiceField(
        required=True,
        initial='event',
        choices = event_type_choices,
        widget=forms.RadioSelect,
        label=''
    )
    event_name = forms.CharField(
        required=True, max_length=80, label='表題')
    is_allday = forms.BooleanField(initial=False, label='終日')
    start_date = forms.DateTimeField(
        required=True,
        label='開始日時',
        widget = forms.DateTimeInput(attrs={'type': 'datetime-local'})
    )
    end_date = forms.DateTimeField(
        required=True,
        label='終了日時',
        widget = forms.DateTimeInput(attrs={'type': 'datetime-local'})
    )
    description = forms.CharField(widget=forms.Textarea(), label='記事')


# イベントリストのリクエストのときのバリデーション用
class CalendarForm(forms.Form):
    start_date = forms.IntegerField(required=True)
    end_date = forms.IntegerField(required=True)

# 新規イベント用フォームのバリデーション用
class NewEventFormValidator(forms.Form):
    event_type = forms.CharField(required=False, max_length=30, initial='event')
    is_allday = forms.BooleanField(required=False, initial=False)
    start_date = forms.DateTimeField(required=False, initial=0)
    end_date = forms.DateTimeField(required=False, initial=0)
