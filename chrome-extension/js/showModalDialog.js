
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

	// ポップアップ
	window.addEventListener("beforeunload", () => {
		if (typeof window.returnValue !== "undefined") {
			if (window.opener && window.opener[returnValueContainerKey]) {
				window.opener[returnValueContainerKey].returnValue = returnValue;
			}
		}
	});
	if (window.opener && window.opener[returnValueContainerKey]) {
		window.dialogArguments = window.opener[returnValueContainerKey].dialogArguments;
	}

	// メインページ
	document.addEventListener("DOMContentLoaded", () => {
		let latestClickedElement = null;
		let triggerElement = null;
		let latestReturnValue = null;
		let latestDialogArguments = null;
		window[returnValueContainerKey] = new Proxy({}, {
			set: (obj, key, value) => {
				if (key === "returnValue") {
					latestReturnValue = value;
					const elem = triggerElement;
					triggerElement = null;
					if (elem) {
						elem.click();
					}
				}
			},
			get: (obj, key) => {
				if (key === "dialogArguments") {
					const dialogArguments = latestDialogArguments;
					latestDialogArguments = null;
					return dialogArguments;
				}
			}
		});
		window.showModalDialog = (url, dialogArguments, windowStyle = "") => {
			if (latestReturnValue) {
				const returnValue = latestReturnValue;
				latestReturnValue = null;
				return returnValue;
			} else {
				latestDialogArguments = dialogArguments;
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
