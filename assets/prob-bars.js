/* 可复用横向概率条形图（单系列，用于展示离散概率分布）。
 * 用法：
 *   renderProbBars(containerEl, [{ label: "好", p: 0.42 }, …], { sampledIndex: 2 })
 * p 取 0–1；sampledIndex 可选，高亮被抽中的一行。
 * 未来可复用于：softmax 输出、attention 权重等任何「一组归一化权重」。
 */
function renderProbBars(container, items, opts = {}) {
  container.classList.add("prob-bars");
  container.innerHTML = "";
  const maxP = Math.max(...items.map((d) => d.p), 1e-9);
  items.forEach((d, i) => {
    const row = document.createElement("div");
    row.className = "prob-row" + (i === opts.sampledIndex ? " sampled" : "");
    const label = document.createElement("span");
    label.className = "prob-label";
    label.textContent = d.label;
    const track = document.createElement("div");
    track.className = "prob-track";
    const fill = document.createElement("div");
    fill.className = "prob-fill";
    fill.style.width = ((d.p / maxP) * 100).toFixed(1) + "%";
    track.appendChild(fill);
    const value = document.createElement("span");
    value.className = "prob-value";
    value.textContent = (d.p * 100).toFixed(1) + "%";
    row.append(label, track, value);
    container.appendChild(row);
  });
}
