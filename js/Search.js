/**
 * Search Module
 * @param {string} contentSelector - 본문 컨테이너 선택자
 * @param {string} inputSelector - 검색창 input 선택자
 * @param {string} countSelector - 검색 결과 카운트 표시 요소 선택자
 */
export function initSearch({ contentSelector, inputSelector, countSelector }) {
  const content = document.querySelector(contentSelector);
  const input = document.querySelector(inputSelector);
  const countDisplay = document.querySelector(countSelector);

  let marks = [];
  let currentIndex = -1;
  // 문서가 동적으로 로드되므로, 현재 상태의 HTML을 저장할 변수
  let originalHTML = content.innerHTML;

  /**
   * 1. 원본 데이터 업데이트
   * 문서(언어)가 변경되었을 때 호출하여 기준이 되는 HTML을 갱신합니다.
   */
  const updateOriginal = () => {
    originalHTML = content.innerHTML;
  };

  /**
   * 2. 검색 리셋
   * 하이라이트된 스팬들을 모두 걷어내고 원본 HTML 상태로 복구합니다.
   */
  function reset() {
    content.innerHTML = originalHTML;
    marks = [];
    currentIndex = -1;
    updateCount();
  }

  /**
   * 3. 하이라이트 실행
   * @param {string} val - 검색 키워드
   */
  function highlight(val) {
    const searchTerm = val.trim();
    if (!searchTerm) return;

    // 텍스트 노드 순회를 위한 TreeWalker 설정
    const walker = document.createTreeWalker(
      content,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      // 비어있지 않은 텍스트 노드만 수집
      if (node.nodeValue.trim().length > 0) {
        nodes.push(node);
      }
    }

    // 특수문자 이스케이프 (정규식 오류 방지)
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // 단어 전체 매칭을 위한 전역(g), 대소문자 무시(i) 정규식
    const regex = new RegExp(`(${escaped})`, "gi");

    nodes.forEach((node) => {
      const text = node.nodeValue;
      if (regex.test(text)) {
        const span = document.createElement("span");
        span.className = "search-highlight-wrapper";
        // $1은 정규식 그룹()에 일치하는 단어 전체를 의미 (대소문자 유지)
        span.innerHTML = text.replace(regex, "<mark>$1</mark>");
        node.replaceWith(span);
      }
    });

    // 생성된 모든 mark 요소 수집
    marks = Array.from(content.querySelectorAll("mark"));
  }

  /**
   * 4. 포커스 및 스크롤 이동
   */
  function focus(index) {
    marks.forEach((m) => m.classList.remove("current"));

    if (marks[index]) {
      const target = marks[index];
      target.classList.add("current");

      // 검색 결과가 화면 중앙에 오도록 부드럽게 이동
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      updateCount();
    }
  }

  /**
   * 5. 카운트 업데이트
   */
  function updateCount() {
    if (countDisplay) {
      countDisplay.textContent = marks.length
        ? `${currentIndex + 1} / ${marks.length}`
        : "0 / 0";
    }
  }

  /* ------------------------------
      이벤트 리스너 등록
  ------------------------------ */

  // 입력 이벤트: 실시간 검색 및 리셋
  input.addEventListener("input", () => {
    reset();
    const val = input.value;
    if (val.trim()) {
      highlight(val);
      if (marks.length > 0) {
        currentIndex = 0;
        focus(currentIndex);
      }
    }
  });

  // 키보드 네비게이션
  document.addEventListener("keydown", (e) => {
    // 검색창 포커스 단축키 (Ctrl/Cmd + K)
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      input.focus();
    }

    // 엔터키: 다음/이전 결과 이동
    if (e.key === "Enter" && marks.length > 0) {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift + Enter: 이전
        currentIndex = (currentIndex - 1 + marks.length) % marks.length;
      } else {
        // Enter: 다음
        currentIndex = (currentIndex + 1) % marks.length;
      }
      focus(currentIndex);
    }
  });

  // 외부 매니저 인터페이스 반환
  return {
    /**
     * 외부(loadContent 등)에서 문서가 바뀌었을 때 호출
     */
    refresh: () => {
      updateOriginal(); // 새 HTML 스냅샷 저장
      reset(); // 화면 리셋
      input.value = ""; // 입력창 초기화
    },
  };
}
