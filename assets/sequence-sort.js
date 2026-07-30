/* 可复用组件：工序排序练习
 *
 * 检索练习用：给一堆打乱的步骤，让学习者按正确顺序点出来。
 * 每点一次立刻判定，错了当场说明"为什么它不能在这个位置"——反馈回路尽量紧。
 * 任何有强顺序约束的内容都可以复用（施工工序、水电放线步骤、验收流程、
 * 软装进场次序）。
 *
 * 用法：
 *   <div class="seq-sort" data-items='[
 *     {"t":"水电改造","why":"必须在墙地面封起来之前——埋进去就改不动了"},
 *     {"t":"贴砖","why":"..."}
 *   ]'></div>
 *   <script src="../../../assets/sequence-sort.js"></script>
 *
 * data-items 按【正确顺序】书写，组件自己打乱显示。
 * why = 这一步为什么排在这个位置（点错时和答对时都会用到）。
 */
document.querySelectorAll(".seq-sort").forEach((root) => {
  const items = JSON.parse(root.dataset.items);
  const order = items.map((_, i) => i);
  const shuffled = order.slice().sort(() => Math.random() - 0.5);
  let next = 0; // 下一个应该被点出来的正确序号

  root.innerHTML = `
    <ol class="seq-done"></ol>
    <div class="seq-pool"></div>
    <p class="seq-msg" role="status"></p>
    <button class="ghost seq-reset" hidden>再打乱一次</button>`;

  const done = root.querySelector(".seq-done");
  const pool = root.querySelector(".seq-pool");
  const msg = root.querySelector(".seq-msg");
  const reset = root.querySelector(".seq-reset");

  function build() {
    pool.replaceChildren();
    shuffled.forEach((i) => {
      const b = document.createElement("button");
      b.className = "seq-card";
      b.textContent = items[i].t;
      b.dataset.i = i;
      b.addEventListener("click", () => pick(b, i));
      pool.appendChild(b);
    });
  }

  function pick(btn, i) {
    if (btn.disabled) return;
    if (i === next) {
      btn.disabled = true;
      btn.classList.add("used");
      const li = document.createElement("li");
      li.innerHTML = `<span class="seq-t">${items[i].t}</span>
        <span class="seq-why">${items[i].why}</span>`;
      done.appendChild(li);
      next++;
      if (next === items.length) {
        msg.className = "seq-msg ok";
        msg.textContent = "全对。这个顺序不是习惯，是被「改不动」和「弄脏」两件事逼出来的。";
        reset.hidden = false;
      } else {
        msg.className = "seq-msg ok";
        msg.textContent = "对。";
      }
    } else {
      btn.classList.add("shake");
      setTimeout(() => btn.classList.remove("shake"), 400);
      msg.className = "seq-msg no";
      msg.textContent = `还不行——「${items[next].t}」得排在它前面：${items[next].why}`;
    }
  }

  reset.addEventListener("click", () => {
    shuffled.sort(() => Math.random() - 0.5);
    next = 0;
    done.replaceChildren();
    msg.textContent = "";
    msg.className = "seq-msg";
    reset.hidden = true;
    build();
  });

  build();
});
