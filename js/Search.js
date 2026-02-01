export function initSearch({
  contentSelector,
  inputSelector,
  countSelector,
  onReset,
}) {
  const content = document.querySelector(contentSelector);
  const input = document.querySelector(inputSelector);
  const countDisplay = document.querySelector(countSelector);

  let marks = [];
  let currentIndex = -1;
  let originalHTML = content.innerHTML;

  const updateOriginal = () => {
    originalHTML = content.innerHTML;
  };

  const reset = () => {
    content.innerHTML = originalHTML; // 여기서 모든 이벤트 리스너가 삭제됨
    marks = [];
    currentIndex = -1;
    if (countDisplay) countDisplay.textContent = "0 / 0";

    // ★ 중요: DOM이 복구되었으므로 TOC와 Observer를 다시 연결해야 함
    if (typeof onReset === "function") {
      onReset();
    }
  };

  input.addEventListener("input", () => {
    if (input.value.trim() === "") {
      reset(); // 값이 비워지면 리셋
      return;
    }

    reset(); // 이전 강조 제거를 위해 리셋 후 다시 하이라이트
    highlight(input.value);
    if (marks.length) {
      currentIndex = 0;
      focus(currentIndex);
    }
  });

  const highlight = (val) => {
    if (!val.trim()) return;
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    const regex = new RegExp(
      `(${val.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    nodes.forEach((n) => {
      if (regex.test(n.nodeValue)) {
        const span = document.createElement("span");
        span.className = "search-highlight-wrapper";
        span.innerHTML = n.nodeValue.replace(regex, "<mark>$1</mark>");
        n.replaceWith(span);
      }
    });
    marks = Array.from(content.querySelectorAll("mark"));
  };

  const focus = (idx) => {
    marks.forEach((m) => m.classList.remove("current"));
    if (marks[idx]) {
      marks[idx].classList.add("current");
      marks[idx].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    updateCount();
  };

  const updateCount = () => {
    countDisplay.textContent = marks.length
      ? `${currentIndex + 1} / ${marks.length}`
      : "0 / 0";
  };

  input.addEventListener("input", () => {
    reset();
    if (input.value.trim()) {
      highlight(input.value);
      if (marks.length) {
        currentIndex = 0;
        focus(currentIndex);
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      input.focus();
    }
    if (e.key === "Enter" && marks.length > 0) {
      currentIndex = e.shiftKey
        ? (currentIndex - 1 + marks.length) % marks.length
        : (currentIndex + 1) % marks.length;
      focus(currentIndex);
    }
  });

  return {
    refresh: () => {
      updateOriginal();
      input.value = "";
      reset();
    },
  };
}
