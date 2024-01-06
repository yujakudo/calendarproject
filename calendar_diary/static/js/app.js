//  カレンダーオブジェクト
var calendar;

// イベントの初期データ
var initial_event_data = {
    event_id: "0",
    event_type: "event",
    event_name: "",
    is_allday: true,
    start_date: "",
    end_date: "",
    description: ""
};

// イベントタイプのリスト
var list_event_types = [
    "event", "diary"
];

// CSRF対策
axios.defaults.xsrfHeaderName = "X-CSRFTOKEN"
axios.defaults.xsrfCookieName = "csrftoken"

// イベントリストの取得
function getEventList(info, successCallback, failureCallback) {
    // 開始／終了日時は、日時の部分と時差の部分を分ける
    var ldt_start = splitDateTime(info.startStr);
    var ldt_end = splitDateTime(info.endStr);
    // 送信
    axios.post("/sc/list/", {
        // イベントリストの取得
        start_date: ldt_start[0],
        end_date: ldt_end[0],
    })
    .then((response) => {
        // カレンダーをクリアして、取得したデータをセット
        var data  = convertListForCalendar(response.data);
        calendar.removeAllEvents();
        successCallback(data);
    })
    .catch((error) => {
        // 登録が失敗したら、メッセージを生成し表示
        showError(error);
    });
}

/**
 * イベントデータの配列をカレンダーのデータに変換
 * @param {object[]} l_data サーバが渡すイベントデータの配列 
 */
function convertListForCalendar(l_data) {
    var cal_data = [];
    for(var a_event of l_data) {
        cal_data.push( convertEventForCalendar(a_event) );
    }
    return cal_data;
}

/**
 * 新規イベントの登録
 * @param {object} info fullcalendarから渡される、選択のデータ 
 */
function newEvent(info) {
    // 開始／終了日時は、日時の部分と時差の部分を分ける
    var ldt_start = splitDateTime(info.startStr);
    var ldt_end = splitDateTime(info.endStr);
    // フォームに設定する初期データ
    var data = {
        is_allday: info.allDay,
        start_date: ldt_start[0],
        end_date: ldt_end[0]
    }
    // ポップアップの表示
    openPopup(data, {submitButton: "登録"})
}

/**
 * ポップアップを開く
 * @param {object} data フォームに設定する初期データ 
 * @param {object} options オプション 
 */
function openPopup(data, options) {
    // クリアしてから表示
    clearPopup();
    $("#popup-screen").show();
    // 初期値を設定
    setEventToForm(data);
    //  表示する、イベントタイプの選択肢。初期値は全て
    var opts = list_event_types.concat();
    if( 'event_id' in data && data.event_id>0) {
        // IDが指定されていたら、それだけ表示
        opts = [ data.event_type ];
    } else if( !data.is_allday ) {
        // IDが０で、終日でないなら、eventのみ
        opts = ['event'];
    }
    showTypeOptions(opts);

    //  オプション
    //  送信ボタンの表示／非表示
    if('submitButton' in options) {
        showSubmitButton(options.submitButton);
    }
}

/**
 * ポップアップのフォームのクリア
 */
function clearPopup() {
    // イベントタイプのオプションは全て表示しない
    showTypeOptions([]);
    // 送信ボタンも表示しない
    showSubmitButton('');
    //  フォームに初期データを設定
    setEventToForm(initial_event_data);
}

/**
 * イベントタイプのオプションの表示／非表示切り替え
 * @param {string[]} opts 表示するイベントタイプ名の配列 
 */
function showTypeOptions(opts) {
    // 全てのイベントタイプについてループ
    for(var i=0; i<list_event_types.length; i++) {
        if(opts.indexOf(list_event_types[i])>=0) {
            // 引数の配列にあるタイプは表示
            $("#id_event_type_"+i).parent().show();
        } else {
            // なければ非表示
            $("#id_event_type_"+i).parent().hide();
        }
    }
}

/**
 * 送信ボタンの表示／非表示
 * @param {string} caption ボタンのキャプション
 *      空文字列の場合は、ボタンを非表示
 */
function showSubmitButton(caption) {
    if(caption!="") {
        // captionが空でなければ、ボタンを表示してキャプションを設定
        $("#event-submit").show();
        $("#event-submit").text(caption);
    } else {
        // captionが空ならば非表示
        $("#event-submit").hide();
    }
}

/**
 * イベントのデータをフォームにセットする
 * @param {object} data イベントのデータ
 */
function setEventToForm(data) {
    if("event_type" in data) {
        // イベントタイプがあれば、その値からインデックス（0,1,）を得て、
        // それに当たる要素にチェックをする。
        // let idx = ['event', 'diary'].indexOf(data.event_type);
        // $("#id_event_type_" + String(idx)).attr("checked", true);
        $('input[name="event_type"]').val([data.event_type]);
    }
    if("is_allday" in data) {
        // 終日のフラグがあれば、チェックボックスにチェックする
        $("#id_is_allday").attr("checked", data.is_allday);
    }
    // 取りうる全てのキー値についてループ
    for(var key in initial_event_data) {
        if(key in data && key!="event_type" && key!="is_allday") {
            // キー値が渡されたデータにあり、タイプ・終日フラグでなければ
            // 対応する要素に値を設定する
            $("#id_"+key).val(data[key]);
        }
    }
}

/**
 * イベントのデータをフォームから取得
 * @returns {object} イベントのデータ
 */
function getEventFromForm() {
    // 初期値データオブジェクトをコピー
    var data = Object.assign({}, initial_event_data);
    // データのキー値ごとのループ
    for(var key in data) {
        if(key=="event_type") {
            // キーがイベントタイプのときは、チェックの付いているラジオボタンの値
            data[key] = $('input[name="'+key+'"]:checked').val();
        } else if(key=="is_allday") {
            // キーが終日フラグのときはcheckedがあるかどうか
            data[key] = $('input[name="'+key+'"]').prop("checked");
        } else {
            // その他のキーのときは、値を取得
            data[key] = $("#id_"+key).val();
        }
    }
    return data;
}

/**
 * 日付時間の文字列を、日付時間本体と時差を分ける
 * @param {string} str  日付時間の文字列
 * @returns {string[]} 日付本体、時差の文字列の順の配列
 */
function splitDateTime(str) {
    // 10文字だったら時間を加えて返す
    if( str.length==10 ) {
        str += "T00:00:00";
        return [str, ""];
    } 
    var pos = -1;
    // 戻り値の初期配列
    var lst = [str, ""];
    if( str.substr(-1)=="Z" ) {
        // 最後の文字がZ（UTC）なら、その前の部分と「Z」に分ける
        lst = [str.substr(0, str.length-1), "Z"];
    } else {
        // 後ろから6文字をとり、その先頭が＋かーなら、その前の部分と後ろ6文字に分ける
        let s_dif = str.substr(-6);
        let c = s_dif.substr(0, 1);
        if( c=="+" || c=="-") {
            lst = [str.substr(0, str.length-6), s_dif]
        }
    }
    return lst;
}

/**
 * イベントデータの送信
 */
function submitEvent(e) {
    // 規定のイベント処理を無効にする
    e.preventDefault();
    // フォームより送信するデータの取得
    var data = getEventFromForm();
    if (data.event_name!="") {
        // サーバにイベント登録のリクエスト
        // todo: 送信先がハードコーディング
        axios.post("/sc/save/", data)
        .then((response) => {
            // 登録が成功したら、レスポンスの本文を
            // カレンダーのデータに変換
            let cal_data = convertEventForCalendar(response.data);
            // カレンダーにイベントの追加
            calendar.addEvent(cal_data);
            closePopup();
        })
        .catch((error) => {
            // 登録が失敗したら、メッセージを生成し表示
            showError(error);
        });
    }
}

/**
 * エラーメッセージを生成し表示
 * @param {object} error axiosが渡すエラーオブジェクト 
 */
function showError(error) {
    // todo：alertよりHTMLに表示のほうがよいか
    let msg = "";
    if(error.response) {
        msg += error.response.status + ": ";
    }
    msg += error.message;
    alert(msg);
}

/**
 * イベントデータをカレンダー用のデータに変える
 * @param {object} data イベントデータ 
 * @returns {object} カレンダー用のデータ
 */
function convertEventForCalendar(data) {
    // イベントタイプより、表示色を決定
    var col = "var(--event-item-color)";
    if( data.event_type=="diary") {
        var col = "var(--diary-item-color)";
    }
    // カレンダー用のデータを返す
    return {
        id: data.id,
        title: data.event_name,
        start: data.start_date,
        end: data.end_date,
        allDay: data.is_allday,
        backgroundColor: col,
        classNames: [ "type-" + data.event_type ]
    }
}

/**
 * ポップアップを閉じる
 */
function closePopup() {
    $("#popup-screen").hide();
}

/**
 * 初期化
 */
function init() {
    //  ポップアップを閉じるボタンの処理を登録
    $("#close-popup").click(closePopup);
    //  送信ボタンの処理を登録
    $("#event-submit").click(submitEvent);
    //  ID="calendar"のタグに要素取得
    var calendarEl = document.getElementById('calendar');
    //  FullCalendarのインスタンスを作成
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',

        // 日付をクリック、または範囲を選択したイベント
        selectable: true,
        select: newEvent,
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