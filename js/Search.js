export function initSearch({
  contentSelector,
  inputSelector,
  countSelector,
  onReset,
}) {
  const content = document.querySelector(contentSelector);
  const input = document.querySelector(inputSelector);
  const countDisplay = document.querySelector(countSelector);
  const resultsList = document.getElementById("searchResults");

  let marks = [];
  let currentIndex = -1;
  let originalHTML = content.innerHTML;

  const updateOriginal = () => {
    originalHTML = content.innerHTML;
  };

  // 결과 목록 보이기/숨기기 헬퍼
  const showResults = () => {
    if (marks.length > 0) resultsList.classList.add("active");
  };
  const hideResults = () => {
    resultsList.classList.remove("active");
  };

  const reset = () => {
    content.innerHTML = originalHTML;
    marks = [];
    currentIndex = -1;
    if (countDisplay) countDisplay.textContent = "0 / 0";
    if (resultsList) {
      resultsList.innerHTML = "";
      hideResults();
    }
    if (typeof onReset === "function") onReset();
  };

  const highlight = (val) => {
    const searchTerm = val.trim();
    if (!searchTerm) return;

    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );

    resultsList.innerHTML = "";

    nodes.forEach((n) => {
      const text = n.nodeValue;
      if (regex.test(text)) {
        const span = document.createElement("span");
        span.className = "search-highlight-wrapper";
        span.innerHTML = text.replace(regex, "<mark>$1</mark>");
        n.replaceWith(span);

        const li = document.createElement("li");
        const itemInner = document.createElement("div");
        itemInner.className = "result-item-inner";
        itemInner.innerHTML = text.replace(regex, "<mark>$1</mark>");

        li.appendChild(itemInner);

        li.addEventListener("mousedown", (e) => {
          // click 대신 mousedown을 사용하거나 stopPropagation을 사용해 input blur보다 먼저 실행되게 함
          const markInSpan = span.querySelector("mark");
          const markIndex = marks.indexOf(markInSpan);
          if (markIndex !== -1) {
            currentIndex = markIndex;
            focus(currentIndex);
          }
        });

        resultsList.appendChild(li);
      }
    });

    marks = Array.from(content.querySelectorAll("mark"));
    showResults();
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
    if (countDisplay) {
      countDisplay.textContent = marks.length
        ? `${currentIndex + 1} / ${marks.length}`
        : "0 / 0";
    }
  };

  /* ------------------------------
      추가 및 수정된 이벤트 리스너
  ------------------------------ */

  // 입력 이벤트
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

  // 1. 인풋 클릭 시 결과창 다시 보여주기
  input.addEventListener("click", (e) => {
    e.stopPropagation(); // document 클릭 이벤트 전파 방지
    showResults();
  });

  // 2. 외부 클릭 시 결과창 닫기 (value는 유지)
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#searchBox")) {
      hideResults();
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
      showResults(); // 엔터 칠 때 결과 확인 가능하게 유지
    }
    if (e.key === "Escape") {
      hideResults();
      input.blur();
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
