//  カレンダーオブジェクト
var calendar;

// CSRF対策
axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
axios.defaults.xsrfCookieName = "csrftoken"

//  イベントの入力
function inputEvent(info) {
    // 入力ダイアログ
    const eventName = prompt("イベントを入力してください");
    if (eventName) {
        // サーバにイベント登録のリクエスト
        axios.post("/sc/add/", {
            start_date: info.start.valueOf(),
            end_date: info.end.valueOf(),
            event_name: eventName,
            is_allday: info.allDay,
        })
        .then(() => {
            // カレンダーにイベントの追加
            calendar.addEvent({
                title: eventName,
                start: info.start,
                end: info.end,
                allDay: info.allDay,
            });

        })
        .catch(() => {
            // バリデーションエラーなど
            alert("登録に失敗しました");
        });
    }
}

// イベントリストの取得
function getEventList(info, successCallback, failureCallback) {
    axios.post("/sc/list/", {
        // イベントリストの取得
        start_date: info.start.valueOf(),
        end_date: info.end.valueOf(),
    })
    .then((response) => {
        // カレンダーをクリアして、取得したデータをセット
        calendar.removeAllEvents();
        successCallback(response.data);
    })
    .catch(() => {
        // バリデーションエラーなど
        alert("イベントの取得に失敗しました");
    });
}

// ポップアップを開く
function openPopup(info) {
    $("#popup-screen").show();
}

// ポップアップを閉じる
function closePopup() {
    $("#popup-screen").hide();
}

// 初期化
function init() {
    //  ポップアップを閉じるボタン
    $("#close-popup").click(closePopup)
    //  ID="calendar"のタグに要素取得
    var calendarEl = document.getElementById('calendar');
    //  FullCalendarのインスタンスを作成
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',

        // 日付をクリック、または範囲を選択したイベント
        selectable: true,
        select: openPopup,
        //  イベントが必要なときに呼ばれるコールバック
        events: getEventList,
        // ツールバーのデザイン
        headerToolbar: {
            left: 'dayGridMonth,timeGridWeek,timeGridDay', 
            center: 'title',
            right: 'today prev,next',
        },
        locale: "ja",
        //  日付のクリックを有効にする
        navLinks: true,
    });
    //  レンダリング
    calendar.render();
}

//  ページがロードされたら初期化関数を実行
document.addEventListener('DOMContentLoaded', init);