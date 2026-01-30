// toc.js
export function initTOC({
  contentSelector,
  menuSelector,
  headingSelector = "h1, h2, h3, h4, h5, h6",
  activeClass = "active",
  collapsedClass = "collapsed",
}) {
  const content = document.querySelector(contentSelector);
  const menu = document.querySelector(menuSelector);
  const headings = Array.from(content.querySelectorAll(headingSelector));

  const items = [];
  let isClickScrolling = false;

  // 1. 현재 문서에서 가장 상위 레벨(가장 작은 숫자) 찾기
  // 예: h2, h3만 있다면 minDepth는 2가 됨.
  const minDepth = headings.reduce((min, h) => {
    const depth = Number(h.tagName.replace("H", ""));
    return depth < min ? depth : min;
  }, 999);

  /* ------------------------------
     메뉴 생성
  ------------------------------ */
  headings.forEach((heading, index) => {
    const depth = Number(heading.tagName.replace("H", ""));
    const id = heading.id || `section-${index}`;
    heading.id = id;

    const li = document.createElement("li");
    li.textContent = heading.textContent;
    li.dataset.target = id;
    li.dataset.depth = depth;
    li.classList.add(`depth-${depth}`);

    // 최상위 레벨인 경우 포인터 커서나 스타일 처리를 위해 클래스 추가 (선택사항)
    if (depth === minDepth) {
      li.classList.add("toc-root-item");
      li.style.cursor = "pointer"; // 클릭 가능하다는 표시
    }

    li.addEventListener("click", (e) => {
      e.stopPropagation();

      // 1. 현재 항목의 하위 자식이 있는지 확인
      // items 배열에서 내 바로 다음 항목이 나보다 깊은(숫자가 큰) depth인지 체크
      const hasChildren = items[index + 1] && items[index + 1].depth > depth;

      // 2. 최상위 레벨이면서 자식이 있는 경우에만 접기/펼치기 수행
      if (depth === minDepth && hasChildren) {
        li.classList.toggle(collapsedClass);
        const isCollapsed = li.classList.contains(collapsedClass);

        toggleGroupVisibility(index, depth, isCollapsed);
        return; // 스크롤 이동 안 함
      }

      // --- 3. 자식이 없거나 하위 레벨인 경우: 스크롤 이동 실행 ---
      const targetEl = document.getElementById(id);
      if (!targetEl) return;

      // 이미 상단에 있다면 중복 스크롤 방지 (이전 답변 로직)
      const rect = targetEl.getBoundingClientRect();
      if (Math.abs(rect.top) < 20) {
        items.forEach((i) => i.li.classList.remove(activeClass));
        li.classList.add(activeClass);
        return;
      }

      // Active 처리 및 스크롤
      items.forEach((i) => i.li.classList.remove(activeClass));
      li.classList.add(activeClass);

      isClickScrolling = true;
      targetEl.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      history.replaceState(null, "", `#${id}`);

      setTimeout(() => {
        isClickScrolling = false;
      }, 400);
    });

    menu.appendChild(li);
    items.push({ heading, li, depth });
  });

  /* ------------------------------
     스크롤 기반 active
  ------------------------------ */
  const observer = new IntersectionObserver(
    (entries) => {
      if (isClickScrolling) return;

      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        // 기존 active 제거
        items.forEach((i) => i.li.classList.remove(activeClass));

        const current = items.find((i) => i.heading === entry.target);

        if (current) {
          current.li.classList.add(activeClass);

          // 스크롤로 하위 항목에 도달했을 때 부모가 닫혀있다면 열어주는 로직 (선택사항)
          // 필요 없다면 expandParents 관련 부분은 제거해도 됩니다.
          expandParents(current);
        }
      });
    },
    {
      root: null, // content 내부 스크롤이 아니라면 null(뷰포트 기준)이 더 정확할 수 있음
      rootMargin: "-40% 0px -55% 0px",
      threshold: 0,
    },
  );

  headings.forEach((h) => observer.observe(h));

  /* ------------------------------
     부모 depth 자동 펼침 (스크롤 시)
  ------------------------------ */
  function expandParents(currentItem) {
    // 역순으로 탐색하여 부모(상위 depth)를 찾아 펼침
    const currentIndex = items.indexOf(currentItem);
    const currentDepth = currentItem.depth;

    // 현재 아이템보다 위에 있는 리스트들을 거꾸로 탐색
    for (let i = currentIndex - 1; i >= 0; i--) {
      const target = items[i];

      // 내 바로 위의 상위 depth를 찾음
      if (target.depth < currentDepth) {
        // 닫혀있다면 열기
        if (target.li.classList.contains(collapsedClass)) {
          target.li.classList.remove(collapsedClass);

          // 해당 부모의 자식들을 다시 보여줌 (단순 display="" 처리만 하면 하위의 하위까지 다 열릴 수 있으므로 주의)
          // 여기서는 단순하게 해당 부모의 직계 자식들을 보여주도록 처리 필요하나,
          // 로직 단순화를 위해 해당 그룹 전체를 다시 보이게 처리
          toggleGroupVisibility(i, target.depth, false);
        }

        // 최상위까지 도달했다면 종료 (또는 계속 위로 탐색)
        if (target.depth === minDepth) break;
      }
    }
  }

  // 특정 인덱스(부모)의 하위 그룹 가시성 제어 헬퍼 함수
  function toggleGroupVisibility(parentIndex, parentDepth, hide) {
    for (let k = parentIndex + 1; k < items.length; k++) {
      if (items[k].depth <= parentDepth) break;
      items[k].li.style.display = hide ? "none" : "";
    }
  }

  /* ------------------------------
     초기 hash
  ------------------------------ */
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) {
      // 해시 이동 시 해당 섹션의 부모가 닫혀있을 수 있으므로 열어주는 로직 필요할 수 있음
      const targetItem = items.find((i) => i.heading === target);
      if (targetItem) expandParents(targetItem);
      target.scrollIntoView();
    }
  }

  document.querySelector(".toc-toggle").addEventListener("click", () => {
    document.body.classList.toggle("toc-open");
  });
  if (window.innerWidth < 768) {
    document.body.classList.remove("toc-open");
  }
}
