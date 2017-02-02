
// 「windowオブジェクト・flashのメソッド」にアクセスする場合これが必要
((fn) => {
	const scriptElement = document.createElement("script");
	const script = fn.toString().replace(/%extension_id%/g, chrome.runtime.id);
	scriptElement.appendChild(document.createTextNode(`(${script})()`));

	const parent = document.head || document.body || document.documentElement;
	parent.appendChild(scriptElement);
	parent.removeChild(scriptElement);
})(() => {
	// 共通
	const newWindowName = "___new_window_%extension_id%";
	const returnValueContainerKey = "___returnValueConnector_%extension_id%";
	const returnValueKey = "_returnValue";

	// ポップアップ
	const originalClose = window.close;
	window.close = () => {
		if (typeof window.returnValue !== "undefined") {
			if (window.opener && window.opener[returnValueContainerKey]) {
				window.opener[returnValueContainerKey][returnValueKey] = returnValue;
			}
		}
		originalClose();
	};

	// メインページ
	document.addEventListener("DOMContentLoaded", () => {
		let latestClickedElement = null;
		let triggerElement = null;
		let latestReturnValue = null;
		window[returnValueContainerKey] = new Proxy({}, {
			set: (obj, key, value) => {
				latestReturnValue = value;
				const elem = triggerElement;
				triggerElement = null;
				if (elem) {
					elem.click();
				}
			}
		});
		window.showModalDialog = (url, _, windowStyle = "") => {
			if (latestReturnValue) {
				const returnValue = latestReturnValue;
				latestReturnValue = null;
				return returnValue;
			} else {
				triggerElement = latestClickedElement;
				windowStyle = windowStyle.replace(/:/g, "=").replace(/;/g, ",").replace(/dialog/g, "");
				window.open(url, newWindowName, windowStyle);
				return null;
			}
		};
		document.body.addEventListener("click", evt => {
			const target = evt.target;
			latestClickedElement = target;
			// useCapture = true とすることでshowModalDialogが呼ばれる前にどの要素をクリックしたか保存できる
		}, /* useCapture = */ true);
	});
});
