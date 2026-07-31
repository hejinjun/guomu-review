/* 可复用 attention 权重热力图组件（多头并排显示）。
 * 用法：
 *   renderAttnHeads(containerEl, {
 *     tokens: ["那只", "黑色的", "猫", …],
 *     query: 2,                                  // 初始 query 的下标
 *     heads: [{ name: "头 1", role: "谁在修饰我", w: [[…], …] }],  // w[query][key]，每行自动归一化
 *     mergeLabel: "只用一个头"                    // 可选：多给一行「把各头压成一组权重」的对照
 *   })
 * 点 token 切换 query。未来可复用于：因果掩码、逐层注意力，
 * 任何「一组或多组注意力权重」的展示。
 */
function renderAttnHeads(container, cfg) {
  const tokens = cfg.tokens;
  let query = cfg.query ?? 0;
  let merged = false;

  const norm = (row) => {
    const s = row.reduce((a, b) => a + b, 0) || 1;
    return row.map((v) => v / s);
  };
  const headRow = (h) => norm(h.w[query]);
  const mergeRow = () => {
    const rows = cfg.heads.map(headRow);
    return norm(rows[0].map((_, i) => rows.reduce((a, r) => a + r[i], 0) / rows.length));
  };

  container.classList.add("attn-heads");
  container.innerHTML = "";

  const strip = document.createElement("div");
  strip.className = "ah-strip";
  const stripLabel = document.createElement("span");
  stripLabel.className = "ah-strip-label";
  stripLabel.textContent = "Query：";
  strip.appendChild(stripLabel);
  const chips = tokens.map((t, i) => {
    const b = document.createElement("button");
    b.className = "ah-chip";
    b.textContent = t;
    b.addEventListener("click", () => { query = i; draw(); });
    strip.appendChild(b);
    return b;
  });

  const grid = document.createElement("div");
  grid.className = "ah-grid";

  const toggle = document.createElement("label");
  toggle.className = "ah-toggle";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.addEventListener("change", () => { merged = box.checked; draw(); });
  toggle.append(box, document.createTextNode(" " + (cfg.mergeLabel || "只用一个头")));

  container.append(strip, grid, toggle);

  function row(name, role, weights, extraClass) {
    const label = document.createElement("div");
    label.className = "ah-name" + (extraClass ? " " + extraClass : "");
    label.innerHTML = `${name}<span class="ah-role">${role}</span>`;
    grid.appendChild(label);
    const cells = document.createElement("div");
    cells.className = "ah-cells";
    const top = weights.indexOf(Math.max(...weights));
    weights.forEach((p, i) => {
      const c = document.createElement("div");
      c.className = "ah-cell" + (i === top ? " ah-top" : "");
      c.style.background = `color-mix(in srgb, var(--series-1) ${(p * 100).toFixed(0)}%, transparent)`;
      c.innerHTML = `<span class="ah-tok">${tokens[i]}</span><span class="ah-pct">${Math.round(p * 100)}%</span>`;
      cells.appendChild(c);
    });
    grid.appendChild(cells);
  }

  function draw() {
    chips.forEach((b, i) => b.classList.toggle("on", i === query));
    grid.innerHTML = "";
    if (merged) {
      row("单头", "三种关系压成一组", mergeRow(), "ah-merged");
    } else {
      cfg.heads.forEach((h) => row(h.name, h.role, headRow(h)));
    }
  }
  draw();
}
