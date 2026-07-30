/* 打印时自动展开页面上所有 <details>。
 * 速查表用折叠是为了手机上好扫读，但打印出来贴墙必须是全展开的。
 * （纯 CSS 做不到——浏览器对未展开的 details 内容是在 UA 层隐藏的。）
 * 任何含折叠内容的速查页都可以引这一个文件。 */
window.addEventListener("beforeprint", () => {
  document.querySelectorAll("details:not([open])").forEach((d) => {
    d.dataset.printOpened = "1";
    d.open = true;
  });
});
window.addEventListener("afterprint", () => {
  document.querySelectorAll("details[data-print-opened]").forEach((d) => {
    d.open = false;
    delete d.dataset.printOpened;
  });
});
