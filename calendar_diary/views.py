import json
import time
from django.http import Http404
from django.template import loader
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render
from django.forms.models import model_to_dict

from .models import Event
from .forms import CalendarForm, EventForm

# Create your views here.

def index(request):
    """
    カレンダー画面
    """
    # CSRFのトークンを発行する
    get_token(request)

    # データを初期値としてフォームをレンダリング
    context = {
        'form': EventForm(),
    }
    return render(request, 'index.html', context)


def save_event(request):
    """
    イベント登録
    """

    if not request.method == "POST":
        # POSTメソッド以外はエラー
        return HttpResponse("リクエストが不正です。",
                            status=404)

    # JSONの解析
    data = json.loads(request.body)

    # バリデーション
    eventForm = EventForm(data)
    if not eventForm.is_valid():
        return HttpResponse("渡されたデータが不正です。",
                            status=400)
    
    data['event_id'] = int(data['event_id'])
    if data['event_id']==0:
        # IDが０なら新規登録
        event = Event(
            event_type=data['event_type'],
            event_name=data['event_name'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            is_allday = data['is_allday'],
            description = data['description'],
        )
    else:
        # IDが０でなければ、データ更新
        # イベントデータを取得
        try:
            event = Event.objects.get(pk=data['event_id'])
        except event.DoesNotExist:
            return HttpResponse("渡されたデータが不正です。",
                                status=400)
        
        # データを更新
        event.event_type=data['event_type']
        event.event_name=data['event_name']
        event.start_date=data['start_date']
        event.end_date=data['end_date']
        event.is_allday = data['is_allday']
        event.description = data['description']

    event.save()
    to_json = event_to_dict(event)
    # イベントデータを返す
    return JsonResponse(to_json, safe=False)

def event_to_dict(event):
    """イベントを辞書に変換する。
    """
    # 辞書に変換
    dct_event = model_to_dict(event)
    # キーidを、event_idに置き換える
    dct_event['event_id'] = dct_event['id']
    del dct_event['id']
    return dct_event


def get_event_list(request):
    """
    任意の期間内の複数のイベントの取得
    """
    if request.method != "POST":
        # POSTメソッド以外はエラー
        return HttpResponse("リクエストが不正です。",
                            status=404)

    # JSONの解析
    data = json.loads(request.body)
    # バリデーション
    calendarForm = CalendarForm(data)
    if calendarForm.is_valid() == False:
        return HttpResponse("渡されたデータが不正です。",
                            status=400)

    # 指定時間内のイベントを検索
    events = Event.objects.filter(
        start_date__lt=data['end_date'], end_date__gt=data['start_date']
    )
    # 配列を作成
    list = []
    for event in events:
        dct_event = event_to_dict(event)
        list.append(dct_event)

    # 作成した配列をJSONで返す
    return JsonResponse(list, safe=False)


def get_event(request, id):
    """
    イベントの取得
    """
    # URLのIDにてイベントデータを取得
    try:
        event = Event.objects.get(pk=id)
    except event.DoesNotExist:
        raise Http404("イベントがありません。")
    
    # JSONのイベントデータを返す
    dct_event = event_to_dict(event)
    return JsonResponse(dct_event, safe=False)
