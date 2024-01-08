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
    "event", "diary", "image"
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
        cal_data = cal_data.concat( convertEventForCalendar(a_event) );
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
    //  ヘッダの編集の表示
    if('editable' in options && options.editable) {
        showHeaderChecks(true);
    }
    //  送信ボタンの表示／非表示
    if('submitButton' in options) {
        showSubmitButton(options.submitButton);
    }
    //  イベントタイプにより、表示を変える
    displayAsEventType();
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
    //  ヘッダーの編集等は非表示
    showHeaderChecks(false);
    $('#image_preview').removeAttr('src');
    $('input[type="file"]').val(null);
}

/**
 * ヘッダーの編集等のチェックボックスの表示／非表示
 * @param {boolean} to_show trueのとき表示 
 */
function showHeaderChecks(to_show) {
    // 削除のチェックは外す
    $("#id-check-to-delete").prop("checked", false);
    if(to_show) {
        // 編集のチェックは外す
        $("#id-check-to-edit").prop("checked", false);
        //  ヘッダの編集・削除を表示
        $(".to-edit").show();
    } else {
        // 編集のチェックを付ける
        $("#id-check-to-edit").prop("checked", true);
        //  ヘッダの編集・削除を隠す
        $(".to-edit").hide();
    }
    changeEditable();
}

/**
 * 編集にチェックがあるかによって、読み取り専用かどうかを変える。
 */
function changeEditable() {
    if($("#id-check-to-edit").prop("checked")) {
        // 編集にチェックがあればreadonlyをとる
        $('.post_event_form input').removeAttr('readonly');
        $('.post_event_form textarea').removeAttr('readonly');
        let type = getEventType();
        // 日記と画像は終日は編集できない。
        if(type=="diary" || type=="image") {
            $('#id_is_allday').attr("checked", true);
            $('#id_is_allday').attr('disabled', true)
                              .attr('readonly', true);
        } else {
            $('#id_is_allday').removeAttr('disabled');
        }
        // 送信ボタンを「更新」として表示する
        showSubmitButton('更新');
    } else {
        // 編集にチェックがなければreadonlyを付ける
        $('.post_event_form input').attr('readonly', true);
        $('.post_event_form textarea').attr('readonly', true);
        $('#id_is_allday').attr('disabled', true);
        // 送信ボタンは表示しない
        showSubmitButton('');
    }
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
 * イベントタイプの選択により、フォームの表示を変える
 */
function displayAsEventType() {
    if("image"==getEventType()) {
        // イベントタイプがimageなら、記事を非表示、画像関連を表示
        $("#id_description").parent().hide();
        $("#id_image").parent().show();
        $("#id_image_area").show();
    } else {
        // それ以外は、記事を表示、画像関連を非表示
        $("#id_description").parent().show();
        $("#id_image").parent().hide();
        $("#id_image_area").hide();
    }
}

/**
 * イベントタイプの取得
 * @returns {string} イベントタイプ
 */
function getEventType() {
    return  $('input[name="event_type"]:checked').val();
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
        // ラジオボタンに値を反映
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
    var src = $('#image_preview').attr('src');
    if(src!="") {
        data['image'] = src;
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
            // 登録成功
            if(data.event_id>0) {
                // イベントIDがあったら、更新なので、カレンダーのイベントを削除
                deleteEvent(data.event_id);
            }
            // レスポンスのデータをカレンダーのデータに変換
            let lst_data = convertEventForCalendar(response.data);
            // カレンダーにイベントの追加
            lst_data.forEach( (cal_data) => {
                calendar.addEvent(cal_data);
                addImage(cal_data);
            });
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

var event_bg_colors = {
    'event': ["var(--event-item-color)" ],
    'diary': ["var(--diary-item-color)" ],
    'image': ["var(--image-item-color)" ],
}

/**
 * イベントデータをカレンダー用のデータに変える
 * @param {object} data イベントデータ 
 * @returns {object[]} カレンダー用のデータの配列
 */
function convertEventForCalendar(data) {
    // カレンダー用のデータ
    var cal_data = {
        id: data.event_id,
        title: data.event_name,
        start: data.start_date,
        end: data.end_date,
        allDay: data.is_allday,
        textColor: "var(--" + data.event_type + "-text-color)",
        borderColor: "var(--" + data.event_type + "-border-color)",
        backgroundColor: "var(--" + data.event_type + "-item-color)",
        display: "auto",
        extendedProps: {
            event_type: data.event_type
        }
    };
    lst = [cal_data];
    // 画像の場合
    if( data.event_type=="image") {
        // 追加情報に画像のURLをセット
        cal_data.extendedProps['image_url'] = data.image_url;
        bg_data.extendedProps['thumbnail_url'] = data.thumbnail_url;
        // サムネイルを表示する背景用にイベントをもう一つ作る。
        bg_data = JSON.parse(JSON.stringify(cal_data));
        // ID、表示形式を背景に、およびクラスを設定
        bg_data.id = bg_data.id + "_image";
        bg_data.display = "background";
        bg_data['classNames'] = [ "event_id_" + data.event_id ];
        lst.append(bd_data);
    }
    return lst;
}

/**
 * ポップアップを閉じる
 */
function closePopup() {
    $("#popup-screen").hide();
}


/**
 * イベントがクリックされたときの処理
 * @param {object} info クリック時の情報
 * @ref https://fullcalendar.io/docs/eventClick
 */
function onEventClick(info) {
    axios.get("/sc/get/"+info.event.id+"/")
    .then((response) => {
        // 時刻はISO形式で送られてくるが、ローカルタイムに変換せずに
        // 手っ取り早くカレンダーの日時を取得する
        response.data.start_date = splitDateTime(info.event.startStr)[0];
        response.data.end_date = splitDateTime(info.event.endStr)[0];
        //  ポップアップを開く
        openPopup(response.data, {editable: true});
    })
    .catch((error) => {
        // 登録が失敗したら、メッセージを生成し表示
        showError(error);
    });
}

/**
 * 削除ボタンが押されたときの処理
 */
function onClickDelete() {
    // 隠しフィールドのIDを取得
    var id = parseInt($("#id_event_id").val())
    // IDが0なら終了
    if(id==0)  return;
    // 送信
    axios.post("/sc/delete/", {event_id: id})
    .then(() => {
        // 成功したらイベントを削除
        deleteEvent(id);
        //  ポップアップを閉じる
        closePopup();
    })
    .catch((error) => {
        // 登録が失敗したら、メッセージを生成し表示
        showError(error);
    });
}

/**
 * カレンダーのイベントを削除する
 * @param {object} id イベントのID 
 */
function deleteEvent(id) {
    var event = calendar.getEventById( id );
    if( event && event.extendedProps.event_type=="image") {
        // イベントタイプがimageなら、背景のイベントを検索して、削除する。
        let added_event  = calendar.getEventById( event.id + "_image" );
        if (added_event) {
            added_event.remove();
        }
    }
    event.remove();
}

/**
 * 画像ファイルが選択されたときの処理
 * プレビュー領域に表示する
 * @param {object} e 
 */
function changeImageFile(e){
    var file = e.target.files[0];
    var reader = new FileReader();
    if(file.type.indexOf('image') < 0){
        alert("画像ファイルを指定してください。");
        return false;
    }
    reader.onload = ((file) => {
        return function(e){
            $('#image_preview').attr('src', e.target.result);
        };
    })(file);
    reader.readAsDataURL(file);
}

/**
 * カレンダーの表示期間が変わった時の、追加の描画
 * イベントの描画の前に呼ばれるので、タイマーでcalendar内の処理が
 * 終わってから追加の描画をするようにしている。
 * @param {object} dateInfo datesSetイベントのデータ
 */
function additionalRender(dateInfo) {
    setTimeout(() => {
        let lst_event = calendar.getEvents();
        // calendarが持っている全てのイベントについてループ
        lst_event.forEach(a_event => {
            // イベントが表示の期間内なら、追加の描画をする。
            if(dateInfo.start<=a_event.start && a_event.end<=dateInfo.end) {
                addImage(a_event);
            }
        });
   }, 10);
}

/**
 * 背景イベントにイメージを加える
 * @param {object} event カレンダーのイベントデータ 
 */
function addImage(a_event) {
    // 追加プロパティにimage_urlがあるときのみ処理
    if('image_url' in a_event.extendedProps) {
        // 月表示ならサムネイル、そうでなければ元イメージのURL
        if(calendar.view.type=='dayGridMonth') {
            url = a_event.extendedProps.thumbnail_url;
        } else {
            url = a_event.extendedProps.image_url;
        }
        // クラスを指定し、背景画像を指定
        $(".event_id_"+a_event.id).css(
            "background-image", 'url("' + url + '")'
        );
    }
}

/**
 * 初期化
 */
function init() {
    //  ポップアップを閉じるボタンの処理を登録
    $("#close-popup").click(closePopup);
    //  送信ボタンの処理を登録
    $("#event-submit").click(submitEvent);
    //  編集チェックボックスの処理を登録
    $("#id-check-to-edit").click(changeEditable);
    //  削除ボタンの処理を登録
    $("#button-delete").click(onClickDelete);
    //  イベントタイプのラジオボタンが押された
    $('input[name="event_type"]').click(displayAsEventType);
    //  画像が選択された
    $('#id_image').change(changeImageFile)
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
        //  イベントがクリックされたときに呼ばれるコールバック
        eventClick: onEventClick,
        //  表示日時の範囲が変わったときに呼ばれるコールバック
        datesSet: additionalRender,
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