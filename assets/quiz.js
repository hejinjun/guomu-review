/* 可复用 quiz 组件。
 * 用法：课程 HTML 中写
 *   <div class="quiz" data-correct="1">
 *     <p class="q">问题？</p>
 *     <div class="opts">
 *       <button>选项 A</button>
 *       <button>选项 B（data-correct 以 0 起数）</button>
 *     </div>
 *     <p class="explain">答对后展示的解释。</p>
 *   </div>
 * 然后引入本文件即可。答错的选项变灰可重试（检索练习：先想再点）。
 */
document.querySelectorAll(".quiz").forEach((quiz) => {
  const correct = parseInt(quiz.dataset.correct, 10);
  quiz.querySelectorAll(".opts button").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      if (quiz.classList.contains("answered")) return;
      if (i === correct) {
        btn.classList.add("correct");
        quiz.classList.add("answered");
      } else {
        btn.classList.add("wrong");
        btn.disabled = true;
      }
    });
  });
});
