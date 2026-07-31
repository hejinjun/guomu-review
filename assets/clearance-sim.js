/* 可复用组件：通行余量模拟器（俯视图）
 *
 * 用来把「净宽多少毫米」翻译成「人在里面能干什么动作」。
 * 后续任何"这个间距够不够"的教学（厨房双排、床边通道、餐桌拉椅、
 * 卫生间洁具间距）都可以直接复用，只换 data-checks 里的判定表。
 *
 * 用法：
 *   <div class="clearance-sim"
 *        data-min="500" data-max="1600" data-value="900"
 *        data-body="470"                        // 一个人的肩部占宽 mm
 *        data-depth="260"                       // 人的前后体厚 mm（俯视图上的厚度）
 *        data-marks='[{"w":900,"label":"国标·通往厨卫下限"}]'
 *        data-checks='[
 *          {"n":1,"w":600,"label":"一个人正常走过"},
 *          {"n":2,"w":1100,"label":"两个人正常错身"}
 *        ]'></div>
 *   <script src="../../../assets/clearance-sim.js"></script>
 *
 * checks 里 n = 这个动作涉及几个人（决定俯视图里画几个人），
 * w = 达成这个动作所需的最小净宽（mm）。判定按 value >= w。
 */
const NS = "http://www.w3.org/2000/svg";
const svgEl = (t, a, txt) => {
  const e = document.createElementNS(NS, t);
  for (const k in a) e.setAttribute(k, a[k]);
  if (txt !== undefined) e.textContent = txt;
  return e;
};

document.querySelectorAll(".clearance-sim").forEach((root) => {
  const d = root.dataset;
  const min = +(d.min || 500);
  const max = +(d.max || 1600);
  const body = +(d.body || 470);
  const depth = +(d.depth || 260);
  const marks = JSON.parse(d.marks || "[]");
  const checks = JSON.parse(d.checks || "[]");
  let value = +(d.value || 900);

  root.innerHTML = `
    <svg viewBox="0 0 480 210" class="cs-svg"></svg>
    <div class="cs-control">
      <label>净宽 <output class="cs-val"></output></label>
      <input type="range" min="${min}" max="${max}" step="10" value="${value}">
    </div>
    <ul class="cs-checks"></ul>`;

  const svg = root.querySelector(".cs-svg");
  const range = root.querySelector("input");
  const out = root.querySelector(".cs-val");
  const list = root.querySelector(".cs-checks");

  // 俯视图布局：走廊横向延伸，两道墙在上下，净宽 = 上下墙之间的距离
  const W = 480, H = 210, LEFT = 96, RIGHT = 24;
  const MAXPX = 132;                     // 最大净宽占多少像素
  const px = (mm) => (mm / max) * MAXPX; // mm → px
  const midY = 96;

  function render() {
    const gap = px(value);
    const yTop = midY - gap / 2, yBot = midY + gap / 2;
    // 当前最"苛刻"的、已经满足的动作决定画几个人
    const passed = checks.filter((c) => value >= c.w);
    const n = passed.length ? Math.max(...passed.map((c) => c.n)) : 1;
    const fits = value >= body * n;      // 肩膀在物理上放不放得下

    svg.replaceChildren();
    // 墙体（斜线填充的一条带子，读起来像剖到的墙）
    for (const [y, h] of [[yTop - 16, 16], [yBot, 16]]) {
      svg.appendChild(svgEl("rect", { x: LEFT, y, width: W - LEFT - RIGHT, height: h, class: "cs-wall" }));
    }
    // 地面
    svg.appendChild(svgEl("rect", { x: LEFT, y: yTop, width: W - LEFT - RIGHT, height: gap, class: "cs-floor" }));

    // 人（俯视：椭圆，横向 = 体厚，纵向 = 肩宽），并排站在净宽方向上
    const cx = LEFT + (W - LEFT - RIGHT) / 2;
    const slot = gap / n;
    for (let i = 0; i < n; i++) {
      const cy = yTop + slot * (i + 0.5);
      // 一个人时居中；多人时前后错开，读起来像在错身
      const dx = n === 1 ? 0 : (i % 2 ? px(depth) * 0.9 : -px(depth) * 0.9);
      svg.appendChild(svgEl("ellipse", {
        cx: cx + dx, cy,
        rx: px(depth) / 2, ry: px(body) / 2,
        class: "cs-person" + (fits ? "" : " over"),
      }));
    }

    // 净宽标注线
    svg.appendChild(svgEl("line", { x1: LEFT - 34, y1: yTop, x2: LEFT - 34, y2: yBot, class: "cs-dim" }));
    for (const y of [yTop, yBot]) {
      svg.appendChild(svgEl("line", { x1: LEFT - 42, y1: y, x2: LEFT - 26, y2: y, class: "cs-dim" }));
    }
    svg.appendChild(svgEl("text", { x: LEFT - 48, y: midY + 4, class: "cs-dimlabel" }, value + ""));

    // 规范红线：在滑杆刻度上标出来
    const marksHtml = marks.map((m) => {
      const pct = ((m.w - min) / (max - min)) * 100;
      return `<span class="cs-mark" style="left:${pct}%" title="${m.label}"></span>`;
    }).join("");
    let holder = root.querySelector(".cs-marks");
    if (!holder) {
      holder = document.createElement("div");
      holder.className = "cs-marks";
      root.querySelector(".cs-control").appendChild(holder);
    }
    holder.innerHTML = marksHtml;

    out.textContent = value + " mm";
    list.innerHTML = checks.map((c) => {
      const ok = value >= c.w;
      return `<li class="${ok ? "ok" : "no"}"><span class="cs-icon">${ok ? "✓" : "✗"}</span>
        <span class="cs-label">${c.label}</span>
        <span class="cs-need">需 ${c.w}</span></li>`;
    }).join("");
  }

  range.addEventListener("input", () => { value = +range.value; render(); });
  render();
});
