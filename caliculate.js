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

