export function initTOC({
  contentSelector,
  menuSelector,
  activeClass = "active",
  collapsedClass = "collapsed",
}) {
  const content = document.querySelector("#content"); // 실제 스크롤 주체
  const menu = document.querySelector(menuSelector);
  const headings = Array.from(
    document.querySelectorAll(
      `${contentSelector} h1, ${contentSelector} h2, ${contentSelector} h3, ${contentSelector} h4, ${contentSelector} h5, ${contentSelector} h6`,
    ),
  );

  if (!headings.length) return;

  const items = [];
  let isClickScrolling = false;

  const minDepth = Math.min(...headings.map((h) => Number(h.tagName[1])));
  menu.innerHTML = "";

  headings.forEach((heading, index) => {
    const depth = Number(heading.tagName[1]);
    const id = `section-${langSelect.value}-${index}`; // 언어별 ID 중복 방지
    heading.id = id;

    const li = document.createElement("li");
    li.textContent = heading.textContent;
    li.className = `depth-${depth}`;
    if (depth === minDepth) li.classList.add("toc-root-item");

    li.addEventListener("click", (e) => {
      e.stopPropagation();
      const hasChildren =
        headings[index + 1] && Number(headings[index + 1].tagName[1]) > depth;

      if (depth === minDepth && hasChildren) {
        li.classList.toggle(collapsedClass);
        toggleGroupVisibility(
          index,
          depth,
          li.classList.contains(collapsedClass),
        );
        return;
      }

      items.forEach((i) => i.li.classList.remove(activeClass));
      li.classList.add(activeClass);
      isClickScrolling = true;

      // content 컨테이너 기준 상대 위치 계산
      const offset = 80;
      const targetPos = heading.offsetTop - offset;

      content.scrollTo({ top: targetPos, behavior: "smooth" });
      setTimeout(() => {
        isClickScrolling = false;
      }, 800);
    });

    menu.appendChild(li);
    items.push({ heading, li, depth });
  });

  /* Intersection Observer 핵심 교정 */
  const observer = new IntersectionObserver(
    (entries) => {
      if (isClickScrolling) return;

      // 상단에서 아래로 내려올 때 가장 먼저 걸리는 항목 찾기
      const visible = entries.find((e) => e.isIntersecting);
      if (visible) {
        items.forEach((i) => i.li.classList.remove(activeClass));
        const activeItem = items.find((i) => i.heading === visible.target);
        if (activeItem) {
          activeItem.li.classList.add(activeClass);
          expandParents(activeItem);
        }
      }
    },
    {
      root: content,
      rootMargin: "-10% 0px -80% 0px", // 화면 상단 10% 지점 감지
      threshold: 0,
    },
  );

  headings.forEach((h) => observer.observe(h));

  function toggleGroupVisibility(idx, d, hide) {
    for (let i = idx + 1; i < items.length; i++) {
      if (items[i].depth <= d) break;
      items[i].li.style.display = hide ? "none" : "";
    }
  }

  function expandParents(currentItem) {
    const currentIndex = items.indexOf(currentItem);
    const currentDepth = currentItem.depth;
    for (let i = currentIndex - 1; i >= 0; i--) {
      const target = items[i];
      if (target.depth < currentDepth) {
        if (target.li.classList.contains(collapsedClass)) {
          target.li.classList.remove(collapsedClass);
          toggleGroupVisibility(i, target.depth, false);
        }
        if (target.depth === minDepth) break;
      }
    }
  }
}
