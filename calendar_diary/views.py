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


def add_event(request):
    """
    イベント登録
    """

    if request.method == "GET":
        # GETは対応しない
        raise Http404()

    # JSONの解析
    datas = json.loads(request.body)

    # バリデーション
    eventForm = EventForm(datas)
    if eventForm.is_valid() == False:
        # バリデーションエラー
        raise Http404()

    # リクエストの取得
    start_date = datas["start_date"]
    end_date = datas["end_date"]
    event_name = datas["event_name"]

    # 日付に変換。JavaScriptのタイムスタンプはミリ秒なので秒に変換
    formatted_start_date = time.strftime(
        "%Y-%m-%d %H:%M:%S", time.localtime(start_date / 1000))
    formatted_end_date = time.strftime(
        "%Y-%m-%d %H:%M:%S", time.localtime(end_date / 1000))

    # 登録処理
    event = Event(
        event_name=str(event_name),
        start_date=formatted_start_date,
        end_date=formatted_end_date,
        is_allday = datas["is_allday"],
    )
    event.save()

    # 空を返却
    return HttpResponse("")


def get_events(request):
    """
    イベントの取得
    """

    if request.method == "GET":
        # GETは対応しない
        raise Http404()

    # JSONの解析
    datas = json.loads(request.body)

    # バリデーション
    calendarForm = CalendarForm(datas)
    if calendarForm.is_valid() == False:
        # バリデーションエラー
        raise Http404()

    # リクエストの取得
    start_date = datas["start_date"]
    end_date = datas["end_date"]

    # 日付に変換。JavaScriptのタイムスタンプはミリ秒なので秒に変換
    formatted_start_date = time.strftime(
        "%Y-%m-%d %H:%M:%S", time.localtime(start_date / 1000))
    formatted_end_date = time.strftime(
        "%Y-%m-%d %H:%M:%S", time.localtime(end_date / 1000))

    # FullCalendarの表示範囲のみ表示
    events = Event.objects.filter(
        start_date__lt=formatted_end_date, end_date__gt=formatted_start_date
    )

    # fullcalendarのため配列で返却
    list = []
    for event in events:
        list.append(
            {
                "title": event.event_name,
                "start": event.start_date,
                "end": event.end_date,
                "allDay": event.is_allday,
            }
        )

    return JsonResponse(list, safe=False)

# # 既存のイベントのためのフォーム
# def form_exist_event(request, event_id):
#     context = {
#         'message':  "",
#         'show_form': True,
#     }
#     event = None
#     init_data =None
#     # IDが指定されていたら、イベントを取得
#     try:
#         event = Event.objects.get(pk=event_id)
#         init_data = {
#             'event_id': event.pk,
#             'event_type': event.event_type,
#             'event_name': event.event_name,
#             'is_allday': event.is_allday,
#             'start_date': event.start_date,
#             'end_date': event.end_date,
#         }
#         context.event_type = event.event_type
#     except Event.model.DoesNotExist:
#         context.message = "データが見つかりません。"
#         context.show_form = False
    
#     context.form = EventForm(event)
#     return render(request, 'event_form.html', context)


# # 既存のイベントのためのフォーム
# def event_form(request):
#     data = {
#         'event_type': 'event',
#     }
#     # データの取得
#     if request.method == "POST":
#         # POSTメソッドのときはJSONデータなのでデコード
#         data = json.loads(request.body)
#     elif request.method == "GET":
#         # GETメソッドのときはそのまま（デバッグ用）
#         data = request.GET
#     else:
#         return HttpResponse("リクエストが不正です。", status=400)

#     if data != None and ('id' in data.keys()) and data['id'] > 0:
#         # IDが指定されていたら、DBよりイベントを取得
#         try:
#             data = Event.objects.get(pk=data['id'])
#         except Event.model.DoesNotExist:
#             return HttpResponse("指定されたデータが見つかりません。", status=400)
#         # DBより取得したデータは検証不要

#     elif data != None:
#         # データがあれば検証する
#         validator = NewEventFormValidator(data)
#         if not validator.is_valid():
#             return HttpResponse("渡されたデータが不正です。", status=400)
        
#     # データを初期値としてフォームをレンダリング
#     context = {
#         'form': EventForm(initial=data)
#     }
#     return render(request, 'event_form.html', context)

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
        print(eventForm.errors)
        return HttpResponse("渡されたデータが不正です。",
                            status=400)
    
    data['event_id'] = int(data['event_id']);
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
        pass

    event.save()
    obj = {
        'event_id': event.pk ,
        'event_type': event.event_type,
        'event_name': event.event_name,
        'start_date': event.start_date,
        'end_date': event.end_date,
        'is_allday': event.is_allday,

    }
    to_json = model_to_dict(event)
    # 空を返却
    return JsonResponse(to_json, safe=False)
