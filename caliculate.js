"use strict";
/**
 * このスクリプトでは，前述の HTML 中のイベントハンドラから呼び出される calculate()
 * 関数を定義する。この関数は <input> 要素から値を読み込み，ローン支払い情報を計算し，
 * <span> 要素中に計算結果を表示する。また，ユーザーのデータを保存し，金融業者への
 * リンクとグラフを表示する。
 */
function calculate(){
  // ドキュメント中の入力要素と出力要素を検索する。
  var amount = document.getElementById('amount');
  var apr =  document.getElementById('apr');
  var years = document.getElementById('years');
  var zipcode = document.getElementById('zipcode');
  var payment = document.getElementById('payment');
  var total = document.getElementById('total');
  var totalInterest = document.getElementById('totalInterelt');

  // 入力要素からユーザーの入力を取得する。データはすべて正しいと想定。

  // 利息をパーセント表記から数値に変換し，年利を月利に変換する。
  // 支払い期間を，年数から月数に変換する。
  var principal = parseFloat(amount.value);
  var interest = parseFloat(apr.value) / 100 / 12;
  var payments = parseFloat(years.value) * 12;

  // 月あたりの支払額を計算する。
  var x = Math.pow(1 + interest, payments); // Math.paw() はべき乗を計算する。
  var monthly = (principal*x*interest)/(x-1);

  // 計算結果が有限の値になった場合は，ユーザーの入力は正しいと見なし，計算結果を表示する。
  if(isFinite(monthly)){
    // 小数点以下 2 桁に丸めて，出力フィールドに表示する。
    payment.innerHTML = monthly.toFixed(2);
    total.innerHTML = (monthly * payments).toFixed(2);
    totalInterest.innerHTML = ((monthly * payments)- principal).toFixed(2);

    // 次回ユーザーが再度訪問したときに元に戻せるように入力を保存する。
    save(amount.value, apr.value, apr.value, years.value, zipcode.value);

    // 広告表示:地元の金融業者を検索して表示。ネットワークエラーは無視。
    try{  // 中括弧中で発生したエラーをキャッチする。
      getLenders(amount.value, apr.value, years.value, zipcode.value);
    }
    catch(e) {/* エラーを無視する　*/ }

    // 最後に，ローン残高や利息，支払いをグラフ表示する。
    chart(principal, interest, monthly, payments);
  } else {
    // 計算結果が数値以外のものや無限大になった場合は，入力が完全
    // ではないか，間違っている。以前に表示していて内容を消去する。
    payment.innerHTML = ""; // この要素のコンテンツを消去する。
    total.innerHTML = "";
    totalInterest.innerHTML = "";
    chart();  // 引数が無い場合は，グラフを消去する。
  }
}

/**
 * ユーザーの入力を localStorage オブジェクトのプロパティに保存する。
 * これらのプロパティは，ユーザーが将来再度訪問したときまで存続する。このストレージ
 * 機能は， file:// URL で実行した場合は， firefox などの一部のブラウザで動作しない。
 * ただし， HTTP 経由の場合は問題なく動作する。
 */
window.onload = function() {
  //　ブラウザが linalStrage をサポートしていて，データが保存されていれば，
  if (window.localStorage && localStorage.loan_amount) {
    document.getElementById('amount').value = localStorage.loan_amount;
    document.getElementById('apr').value = localStorage.loan_apr;
    document.getElementById('years').value = localStorage.loan_years;
    document.getElementById('zipcode').value = localStorage.loan_zipcode;
  }
};

/**
 * ユーザーの入力をサーバーサイドのスクリプトに渡す。（設計上は）このスクリプトから，
 * 地元の金融業者のリンク一覧を返す。実際には，この例では，この様な金融業者検索
 * サービスは提供しない。しかし，サービスが存在すれば，この関数で動作する。
 */
function getLenders(amount, apt, years, zipcode) {
  // ブラウザが XMLHttpRequest オブジェクトをサポートしていない場合，何もしない。
  if (!window.XMLHttpRequest) return;
  // 金融業者のリストを表示する要素を検索する。
  var ad = document.getElementById('lenders');
  if (!ad) return;  // 出力する場所が無い場合は終了する。

  // ユーザーの入力を URL 中の検索パラメーターとしてエンコードする。
  var url = 'getLenders.php' +  // サービス URL +
  '?amt=' + encodeURIComponent(amount) +  // 検索文字列にユーザーデータ。
  '&apr=' + encodeURIComponent(apr) +
  '&yrs=' + encodeURIComponent(years) +
  '&zip=' + encodeURIComponent(zipcode);

  // URL のコンテンツを， XMLHttpRequest オブジェクトを使って取得する。
  var req = new XMLHttpRequest(); // 新たなリクエストを開始する。
  req.open('GET',url);            // url に対して HTTP GET リクエスト発行。
  req.send(null);                 // ボディ部は設定せずにリクエストを送信する。

  /**
   * 関数を終える前に，イベントハンドラ関数を登録しておく。この関数は，後ほど，
   * HTML サーバーからレスポンスが届いたときに呼び出される。このような非同期
   * プログラミングは，クライアントサイド javascript ではよく登場する。
   */
  req.onreadystatechange = function() {
    if (req.readyState == 4 && req.status == 200){
      // ここは，正常なレスポンスを受け取った場合に実行される。
      var responce = req.responseText;    // HTTP レスポンス文字列。
      var lenders = JSON.parse(responce); // JS 配列として解釈。

      // lender オブジェクトの配列を HTML 文字列に変換する。
      var list = "";
      for (var i = 0; i < lenders.length ; i++) {
        list += '<li><a href="' + lenders[i].url + '">' + lenders[i].name + '</a>';
      }

      // 前述した要素中に HTML を表示する。
      ad.innerHTML = '<ul>' + list + '</ul>';
    }
  }
}

// HTML の <canvas> 要素中に，月ごとのローン残高と利子，支払額をグラフ表示する。
// 引数なしで呼び出された場合は，以前に描画していたグラフを消去するだけ。
function chart(principal, interest, monthly,payments){
  var graph = document.getElementById('graph'); // <canvas> タグを取得
  graph.width = graph.width;                    // canvas 要素を消去し初期化するおまじない。

  // 引数なしで呼び出された場合や，ブラウザが <canvas> 要素中のグラフィック
  // 機能をサポートしていない場合は，ここで戻る。
  if (arguments.length == 0 || !graph.GetContext) return;

  // <canvas> 用の「context」オブジェクトを取得し，描画 API を使えるようにする。
  var g = graph.getContext('2d');   // このオブジェクトで，すべての描画が行われる。
  var width = graph.width, height = graph.height; // 描画領域の大きさを取得する。

  // 以下の関数群は支払い回数と，支払額をピクセルに変換する。
  function paymentToX(n) {return n * width/payments;}
  function amountToY(a) {return hight-(a * height/(monthly * payments * 1.05));}

  // 支払額については，(0,0) から， (payment,monthly * payments) まで直線を引く。
  g.moveTo(paymentToX(0),amountToY(0));         // 左下から開始。
  g.lineTo(paymentToX(payments),                // 右上方向に描画。
  amountToY(monthly * payments));
  g.lineTo(paymentToX(payments),amountToY(0));  // 右下方向に移動。
  g.closePath();                                // 始点に戻る。
  g.fillStyle = '#f88';                         // 明るめの赤色。
  g.fill();                                     // 三角形を塗りつぶす。
  g.font = 'Bold 12px sans-serif';              // フォントを定義する。
  g.fillText('Total Interest Payments', 20, 20);// 凡例中にテキストを表示する。

  // 元本の累積総額は非線形なので，グラフ化するには工夫が必要。
  var equity = 0;
  g.beginPath();                                // 新たな図形作成開始。
  g.moveTo(paymentToX(0),amountToY(0));         // 左下から開始。
  for(var p = 1; p <= payments; p++) {
    // 支払いことに利息部分を計算する。
    var thisMonthsInterest = (principal - equity) * interest;
    equity += (monthly - thisMonthsInterest);   // 残りが元本。
    g.lineTo(paymentToX(p),amountToY(0));       //　ここまで線を引く。
  }
  g.lineTo(paymentToX(payments), amountToY(0)); // X 座標まで線を引く。
  g.closePath();                                // 始点に戻る。
  g.fillStyle = 'green';                        // 緑色を選択。
  g.fill();                                     // 曲線より下の部分を塗りつぶす。
  g.fillText('Total Equity', 20, 35);           // 緑色でラベルをつける。



}

