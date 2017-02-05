
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
	const showModalDialogDataMediatorKey = "___showModalDialogDataMediator_%extension_id%";

	// ポップアップ
	window.addEventListener("beforeunload", () => {
		if (typeof window.returnValue !== "undefined") {
			if (window.opener && window.opener[showModalDialogDataMediatorKey]) {
				window.opener[showModalDialogDataMediatorKey].returnValue = returnValue;
			}
		}
	});
	if (window.opener && window.opener[showModalDialogDataMediatorKey]) {
		window.dialogArguments = window.opener[showModalDialogDataMediatorKey].dialogArguments;
	}

	// メインページ
	document.addEventListener("DOMContentLoaded", () => {
		const NO_DATA = new class NoData{};
		const undefined = void 0;
		let latestClickedElement = null;
		let triggerElement = null;
		let latestReturnValue = NO_DATA;
		let latestDialogArguments = NO_DATA;
		window[showModalDialogDataMediatorKey] = new Proxy({}, {
			set: (obj, key, value) => {
				if (key === "returnValue" && triggerElement) {
					latestReturnValue = value;
					const elem = triggerElement;
					triggerElement = null;
					latestDialogArguments = NO_DATA;
					elem.click();
				}
			},
			get: (obj, key) => {
				if (key === "dialogArguments") {
					if (latestDialogArguments === NO_DATA) {
						return undefined;
					} else {
						return latestDialogArguments;
					}
				}
			}
		});
		window.showModalDialog = (url, dialogArguments, windowStyle = "") => {
			if (latestReturnValue !== NO_DATA) {
				const returnValue = latestReturnValue;
				latestReturnValue = NO_DATA;
				return returnValue;
			} else {
				latestDialogArguments = dialogArguments;
				triggerElement = latestClickedElement;
				windowStyle = windowStyle.replace(/:/g, "=").replace(/;/g, ",").replace(/dialog/g, "");
				window.open(url, newWindowName, windowStyle);
				return undefined;
			}
		};
		document.body.addEventListener("click", evt => {
			const target = evt.target;
			latestClickedElement = target;
			// useCapture = true とすることでshowModalDialogが呼ばれる前にどの要素をクリックしたか保存できる
		}, /* useCapture = */ true);
	});
});
