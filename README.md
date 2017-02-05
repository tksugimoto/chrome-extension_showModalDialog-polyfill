# 特定の条件を満たす場合にshowModalDialogを再現するChrome拡張

## 対象
### システム
* showModalDialogを使うためIEでしか使えない
* サーバーが返すコード（JavaScript）を変更できない

### ブラウザ
* Chrome
* Vivaldi
* その他Chrome拡張を使えるブラウザ

## 使用可能条件
* 特定の要素をクリックしたときにshowModalDialogが1回だけ呼ばれる
	* ページ読み込み時に自動でshowModalDialogが呼ばれる場合は対応不可
	* showModalDialogを2回以上連続での実行は対応不可
		* showModalDialogの返り値を使ってまた別のshowModalDialogを呼ぶなど
* showModalDialogの返り値がない (`undefined`) 場合にページ遷移などをしない
	* 完全な再現は無理なので、showModalDialogを2回呼ぶようにしています
		* 1回目は即座に `undefined` を返して、dialogが閉じられるなどのイベントによって正しい返り値を2回目で返します
		* 2回目はJavaScriptで自動実行されます
		* そのため、返り値が `undefined` の場合にページ遷移などをされると望む動作になりません


### 返り値が無い場合にページ遷移などをしない例
HTML
```html
<input type="button" id="open-dialog" value="ポップアップを開く"><br>
<pre id="return-value"></pre>
```
JavaScript
```js
document.getElementById("open-dialog").addEventListener("click", () => {
	const url = "popup.html";
	const dialogArguments = {
		// dialogに渡したい値
		dialogArgument1: document.getElementById("dialogArgument1").value,
		dialogArgument2: [1,3,5]
	};
	const windowStyle = "dialogwidth: 800; dialogheight: 700; resizable: yes";
	const returnValue = window.showModalDialog(url, dialogArguments, windowStyle);
	if (returnValue) {
		// 操作が返り値がある場合のみ処理する
		document.getElementById("return-value").innerText = JSON.stringify(returnValue, "", "\t");
	}
});
```

## 備考
* 対象ページがすべてのページになっていますが、必要なページのみで実行するように制限することをおすすめします
	* 変更箇所: `manifest.json` の `content_scripts` -> `matches`
	* 表記法: [Match Patterns - Google Chrome](https://developer.chrome.com/extensions/match_patterns "https://developer.chrome.com/extensions/match_patterns")
* `returnValue` の結果を `alert` などすると2回実行されますが仕様です
	* 1回目は `undefined` になります
	* 2回目に dialogからの返り値が返ってきます
		* 2回目はJavaScriptによって自動実行されます
* dialogを出したときに元ウィンドウはブロックされません
* dialog側で `returnValue` に値が入っている状態でページを離れると元ウィンドウに渡されます
	* ウィンドウを閉じる
	* ページ更新
	* 別ページへの遷移
