/* 可复用组件：户型图渲染器（SVG，无外部图片）
 *
 * 数据来自 window.GUOMU_PLANS（见 assets/plan-case-house.js），坐标单位毫米。
 * 后续讲动线、水电点位、家具布置都可以在同一份数据上加图层，几何不用重画。
 *
 * 用法：
 *   <div class="floorplan" data-plan="caseHouse" data-mode="view"></div>
 *   <script src="../../../assets/plan-case-house.js"></script>
 *   <script src="../../../assets/floorplan.js"></script>
 *
 * data-mode:
 *   view     —— 静态图，标房间名与面积，含图例
 *   dims     —— view + 尺寸标注
 *   identify —— 答题模式：墙可点，点完告诉你它是什么类型、为什么；带计分
 * data-ask  —— identify 模式下的题干（可选）
 */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const mk = (t, a, txt) => {
    const e = document.createElementNS(NS, t);
    for (const k in a) e.setAttribute(k, a[k]);
    if (txt !== undefined) e.textContent = txt;
    return e;
  };
  const TYPE_CN = { bearing: "承重墙", partition: "非承重隔墙", shaft: "管道井 / 立管" };

  document.querySelectorAll(".floorplan").forEach((root) => {
    const plan = (window.GUOMU_PLANS || {})[root.dataset.plan];
    if (!plan) { root.textContent = "户型数据未加载"; return; }
    const mode = root.dataset.mode || "view";
    const [PW, PH] = plan.size;
    const PAD = mode === "dims" ? 620 : 340;         // 图纸外留白（放标注）
    const vbW = PW + PAD * 2, vbH = PH + PAD * 2;
    const X = (mm) => mm + PAD, Y = (mm) => mm + PAD;

    root.innerHTML = `
      ${mode === "identify" ? `<p class="fp-ask">${root.dataset.ask || "点一面墙，判断它是什么"}</p>` : ""}
      <svg class="fp-svg" viewBox="0 0 ${vbW} ${vbH}" role="img"></svg>
      ${mode === "identify" ? '<p class="fp-msg" role="status"></p>' : ""}
      <ul class="fp-legend"></ul>`;
    const svg = root.querySelector(".fp-svg");
    const msg = root.querySelector(".fp-msg");

    // 1) 室内地面
    svg.appendChild(mk("rect", { x: X(0), y: Y(0), width: PW, height: PH, class: "fp-slab" }));

    // 2) 墙体
    const found = new Set();
    for (const w of plan.walls) {
      const r = mk("rect", {
        x: X(w.x), y: Y(w.y), width: w.w, height: w.h,
        class: "fp-wall fp-" + w.type, "data-id": w.id,
      });
      if (mode === "identify") {
        r.classList.add("clickable");
        r.addEventListener("click", () => {
          if (found.has(w.id)) return;
          found.add(w.id);
          r.classList.add("revealed");
          const done = found.size === plan.walls.length;
          msg.className = "fp-msg ok";
          msg.innerHTML = `<strong>${w.name} — ${TYPE_CN[w.type]}</strong><br>${w.why}`
            + (done ? "<br><em>全部认完了。注意一件事：这些结论是我告诉你的，真项目里你必须自己去拿结构图核对。</em>"
                    : `<br><span class="fp-progress">已认出 ${found.size} / ${plan.walls.length}</span>`);
        });
      }
      svg.appendChild(r);
    }

    // 3) 洞口：先用底色把墙"切开"，再画门窗符号
    for (const o of plan.openings) {
      svg.appendChild(mk("rect", { x: X(o.x), y: Y(o.y), width: o.w, height: o.h, class: "fp-cut" }));
      const horiz = o.host === "h";
      const len = horiz ? o.w : o.h;
      const cx = X(o.x) + (horiz ? 0 : o.w / 2);
      const cy = Y(o.y) + (horiz ? o.h / 2 : 0);
      if (o.type === "window") {
        // 窗：洞口内两条细线
        for (const t of [0.35, 0.65]) {
          svg.appendChild(horiz
            ? mk("line", { x1: X(o.x), y1: Y(o.y) + o.h * t, x2: X(o.x) + o.w, y2: Y(o.y) + o.h * t, class: "fp-win" })
            : mk("line", { x1: X(o.x) + o.w * t, y1: Y(o.y), x2: X(o.x) + o.w * t, y2: Y(o.y) + o.h, class: "fp-win" }));
        }
      } else if (o.type === "door") {
        // 门：门扇一条线 + 开启弧线（画法为通用制图习惯，图例标准见 GB/T 50104-2010）
        const x0 = horiz ? X(o.x) : cx, y0 = horiz ? cy : Y(o.y);
        const x1 = horiz ? X(o.x) : cx + len, y1 = horiz ? cy + len : Y(o.y);
        svg.appendChild(mk("line", { x1: x0, y1: y0, x2: x1, y2: y1, class: "fp-leaf" }));
        svg.appendChild(mk("path", {
          d: horiz
            ? `M ${X(o.x)} ${cy} A ${len} ${len} 0 0 1 ${X(o.x) + len} ${cy + len}`
            : `M ${cx} ${Y(o.y)} A ${len} ${len} 0 0 0 ${cx + len} ${Y(o.y) + len}`,
          class: "fp-swing",
        }));
      } else {
        // 无门的过人洞口：两侧画短垛
        svg.appendChild(mk("rect", { x: X(o.x), y: Y(o.y), width: o.w, height: o.h, class: "fp-pass" }));
      }
      if (o.label) {
        svg.appendChild(mk("text", {
          x: X(o.x) + o.w / 2 + (horiz ? 0 : 260), y: Y(o.y) + o.h / 2 + 90,
          class: "fp-tag", "text-anchor": horiz ? "middle" : "start",
        }, o.label));
      }
    }

    // 4) 房间名与面积
    for (const rm of plan.rooms) {
      const cx = X(rm.x) + rm.w / 2, cy = Y(rm.y) + rm.h / 2;
      svg.appendChild(mk("text", { x: cx, y: cy - 20, class: "fp-room" }, rm.name));
      svg.appendChild(mk("text", { x: cx, y: cy + 190, class: "fp-area" }, rm.area + " ㎡"));
    }

    // 5) 尺寸标注
    if (mode === "dims") {
      for (const d of plan.dims) {
        const off = 300;
        const vertical = d.x1 === d.x2;
        const ax = vertical ? X(d.x1) - off : X(d.x1);
        const ay = vertical ? Y(d.y1) : Y(d.y1) + off;
        const bx = vertical ? X(d.x2) - off : X(d.x2);
        const by = vertical ? Y(d.y2) : Y(d.y2) + off;
        const cls = "fp-dim" + (d.warn ? " warn" : "");
        svg.appendChild(mk("line", { x1: ax, y1: ay, x2: bx, y2: by, class: cls }));
        for (const [tx, ty] of [[ax, ay], [bx, by]]) {
          svg.appendChild(mk("line", {
            x1: tx - (vertical ? 70 : 0), y1: ty - (vertical ? 0 : 70),
            x2: tx + (vertical ? 70 : 0), y2: ty + (vertical ? 0 : 70), class: cls,
          }));
        }
        svg.appendChild(mk("text", {
          x: (ax + bx) / 2 - (vertical ? 90 : 0), y: (ay + by) / 2 + (vertical ? 0 : 210),
          class: "fp-dimtext" + (d.warn ? " warn" : ""),
          "text-anchor": vertical ? "end" : "middle",
        }, d.label));
      }
      svg.appendChild(mk("text", { x: X(0), y: Y(PH) + 560, class: "fp-note" }, "单位：mm（毫米）"));
    }

    // 6) 图例
    const kinds = [...new Set(plan.walls.map((w) => w.type))];
    root.querySelector(".fp-legend").innerHTML = kinds
      .map((k) => `<li><span class="sw fp-${k}"></span>${TYPE_CN[k]}</li>`).join("")
      + '<li><span class="sw fp-swin"></span>窗</li><li><span class="sw fp-sdoor"></span>门（弧线为开启方向）</li>';
  });
})();
