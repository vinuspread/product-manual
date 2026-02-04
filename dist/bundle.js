(() => {
  // js/Toc.js
  function initTOC({
    contentSelector,
    menuSelector,
    activeClass = "active",
    collapsedClass = "collapsed"
  }) {
    const content = document.querySelector("#content");
    const menu = document.querySelector(menuSelector);
    const headings = Array.from(
      document.querySelectorAll(
        `${contentSelector} h1, ${contentSelector} h2, ${contentSelector} h3, ${contentSelector} h4, ${contentSelector} h5, ${contentSelector} h6`
      )
    );
    if (!headings.length) return;
    const items = [];
    let isClickScrolling = false;
    const minDepth = Math.min(...headings.map((h) => Number(h.tagName[1])));
    menu.innerHTML = "";
    headings.forEach((heading, index) => {
      const depth = Number(heading.tagName[1]);
      const id = `section-${langSelect.value}-${index}`;
      heading.id = id;
      const li = document.createElement("li");
      li.textContent = heading.textContent;
      li.className = `depth-${depth}`;
      if (depth === minDepth) li.classList.add("toc-root-item");
      li.addEventListener("click", (e) => {
        e.stopPropagation();
        const hasChildren = headings[index + 1] && Number(headings[index + 1].tagName[1]) > depth;
        if (depth === minDepth && hasChildren) {
          li.classList.toggle(collapsedClass);
          toggleGroupVisibility(
            index,
            depth,
            li.classList.contains(collapsedClass)
          );
          return;
        }
        items.forEach((i) => i.li.classList.remove(activeClass));
        li.classList.add(activeClass);
        isClickScrolling = true;
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
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling) return;
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
        rootMargin: "-10% 0px -80% 0px",
        // 화면 상단 10% 지점 감지
        threshold: 0
      }
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

  // js/Search.js
  function initSearch({
    contentSelector,
    inputSelector,
    countSelector,
    onReset
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
      while (node = walker.nextNode()) nodes.push(node);
      const regex = new RegExp(
        `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi"
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
        countDisplay.textContent = marks.length ? `${currentIndex + 1} / ${marks.length}` : "0 / 0";
      }
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
    input.addEventListener("click", (e) => {
      e.stopPropagation();
      showResults();
    });
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
        currentIndex = e.shiftKey ? (currentIndex - 1 + marks.length) % marks.length : (currentIndex + 1) % marks.length;
        focus(currentIndex);
        showResults();
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
      }
    };
  }

  // js/docsData.js
  var docsData = {
    ko: `
    <h2>\uC911\uC694 \uC548\uC804 \uC9C0\uCE68</h2>
<ol>
  <li>\uC774 \uC9C0\uCE68\uC744 \uC77D\uC73C\uC2ED\uC2DC\uC624.</li>
  <li>\uC774 \uC9C0\uCE68\uC744 \uBCF4\uAD00\uD558\uC2ED\uC2DC\uC624.</li>
  <li>\uBAA8\uB4E0 \uACBD\uACE0\uC5D0 \uC8FC\uC758\uD558\uC2ED\uC2DC\uC624.</li>
  <li>\uBAA8\uB4E0 \uC9C0\uCE68\uC744 \uB530\uB974\uC2ED\uC2DC\uC624.</li>
  <li>\uBCF8 \uAE30\uAE30\uB97C \uBB3C \uADFC\uCC98\uC5D0\uC11C \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624.</li>
  <li>\uC81C\uD488 \uD45C\uBA74\uC758 \uC624\uC5FC\uB41C \uBD80\uC704\uB294 \uBD80\uB4DC\uB7FD\uACE0 \uB9C8\uB978 \uCC9C\uC774\uB098 \uC816\uC740 \uCC9C\uC73C\uB85C \uB2E6\uC73C\uC2ED\uC2DC\uC624. (\uC54C\uCF54\uC62C, \uC6A9\uC81C, \uACC4\uBA74\uD65C\uC131\uC81C \uB610\uB294 \uC624\uC77C \uC131\uBD84\uC774 \uD3EC\uD568\uB41C \uC138\uC81C\uB098 \uD654\uC7A5\uD488\uC744 \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624. \uC81C\uD488\uC774 \uBCC0\uD615\uB418\uAC70\uB098 \uC190\uC0C1\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.)
  </li>
  <li>\uD1B5\uD48D\uAD6C\uB97C \uB9C9\uC9C0 \uB9C8\uC2ED\uC2DC\uC624. \uC81C\uC870\uC5C5\uCCB4\uC758 \uC9C0\uCE68\uC5D0 \uB530\uB77C \uC124\uCE58\uD558\uC2ED\uC2DC\uC624.</li>
  <li>\uB77C\uB514\uC5D0\uC774\uD130, \uC5F4 \uC870\uC808\uAE30, \uC2A4\uD1A0\uBE0C \uB610\uB294 \uC5F4\uC744 \uBC1C\uC0DD\uD558\uB294 \uAE30\uD0C0 \uC7A5\uCE58(\uC570\uD504 \uD3EC\uD568)\uC640 \uAC19\uC740 \uC5F4\uC6D0 \uADFC\uCC98\uC5D0 \uC124\uCE58\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624.</li>
  <li>\uADF9\uC131 \uB610\uB294 \uC811\uC9C0\uD615 \uD50C\uB7EC\uADF8\uC758 \uC548\uC804 \uBAA9\uC801\uC744 \uBB34\uC2DC\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624. \uADF9\uC131 \uD50C\uB7EC\uADF8\uC5D0\uB294 \uB450 \uAC1C\uC758 \uB0A0\uC774 \uC788\uC73C\uBA70 \uD558\uB098\uAC00 \uB2E4\uB978 \uAC83\uBCF4\uB2E4 \uB113\uC2B5\uB2C8\uB2E4. \uC811\uC9C0\uD615 \uD50C\uB7EC\uADF8\uC5D0\uB294 \uB450 \uAC1C\uC758 \uB0A0\uACFC \uC138 \uBC88\uC9F8 \uC811\uC9C0 \uB2E8\uC790\uAC00 \uC788\uC2B5\uB2C8\uB2E4. \uB113\uC740 \uB0A0 \uB610\uB294
    \uC138 \uBC88\uC9F8 \uB2E8\uC790\uB294 \uC0AC\uC6A9\uC790\uC758 \uC548\uC804\uC744 \uC704\uD574 \uC81C\uACF5\uB429\uB2C8\uB2E4. \uC81C\uACF5\uB41C \uD50C\uB7EC\uADF8\uAC00 \uCF58\uC13C\uD2B8\uC5D0 \uB9DE\uC9C0 \uC54A\uC73C\uBA74 \uC804\uAE30 \uAE30\uC220\uC790\uC5D0\uAC8C \uBB38\uC758\uD558\uC5EC \uB178\uD6C4\uB41C \uCF58\uC13C\uD2B8\uB97C \uAD50\uCCB4\uD558\uC2ED\uC2DC\uC624.</li>
  <li>\uC804\uC6D0 \uCF54\uB4DC\uAC00 \uBC1F\uD788\uAC70\uB098 \uB07C\uC774\uC9C0 \uC54A\uB3C4\uB85D \uBCF4\uD638\uD558\uC2ED\uC2DC\uC624. \uD2B9\uD788 \uD50C\uB7EC\uADF8, \uD3B8\uC758 \uCF58\uC13C\uD2B8 \uBC0F \uAE30\uAE30\uC5D0\uC11C \uB098\uC624\uB294 \uC9C0\uC810\uC5D0 \uC8FC\uC758\uD558\uC2ED\uC2DC\uC624.</li>
  <li>\uC81C\uC870\uC5C5\uCCB4\uC5D0\uC11C \uC9C0\uC815\uD55C \uBD80\uC18D\uD488/\uC561\uC138\uC11C\uB9AC\uB9CC \uC0AC\uC6A9\uD558\uC2ED\uC2DC\uC624.</li>
  <li>\uC81C\uC870\uC5C5\uCCB4\uC5D0\uC11C \uC9C0\uC815\uD558\uAC70\uB098 \uAE30\uAE30\uC640 \uD568\uAED8 \uD310\uB9E4\uB418\uB294 \uCE74\uD2B8, \uC2A4\uD0E0\uB4DC, \uC0BC\uAC01\uB300, \uBE0C\uB798\uD0B7 \uB610\uB294 \uD14C\uC774\uBE14\uB9CC \uC0AC\uC6A9\uD558\uC2ED\uC2DC\uC624. \uCE74\uD2B8\uB97C \uC0AC\uC6A9\uD560 \uB54C \uCE74\uD2B8/\uAE30\uAE30 \uC870\uD569\uC744 \uC774\uB3D9\uD560 \uB54C \uB118\uC5B4\uC838 \uBD80\uC0C1\uC744 \uC785\uC9C0 \uC54A\uB3C4\uB85D \uC8FC\uC758\uD558\uC2ED\uC2DC\uC624.</li>
  <li>\uBC88\uAC1C\uAC00 \uCE58\uAC70\uB098 \uC7A5\uAE30\uAC04 \uC0AC\uC6A9\uD558\uC9C0 \uC54A\uC744 \uB54C\uB294 \uBCF8 \uAE30\uAE30\uC758 \uD50C\uB7EC\uADF8\uB97C \uBF51\uC73C\uC2ED\uC2DC\uC624.</li>
  <li>\uBAA8\uB4E0 \uC11C\uBE44\uC2A4\uB294 \uC790\uACA9\uC744 \uAC16\uCD98 \uC11C\uBE44\uC2A4 \uB2F4\uB2F9\uC790\uC5D0\uAC8C \uC758\uB8B0\uD558\uC2ED\uC2DC\uC624. \uC804\uC6D0 \uACF5\uAE09 \uCF54\uB4DC\uB098 \uD50C\uB7EC\uADF8\uAC00 \uC190\uC0C1\uB418\uC5C8\uAC70\uB098, \uC561\uCCB4\uB97C \uC3DF\uC558\uAC70\uB098, \uBB3C\uCCB4\uAC00 \uAE30\uAE30\uC5D0 \uB5A8\uC5B4\uC84C\uAC70\uB098, \uAE30\uAE30\uAC00 \uBE44\uB098 \uC2B5\uAE30\uC5D0 \uB178\uCD9C\uB418\uC5C8\uAC70\uB098, \uC815\uC0C1\uC801\uC73C\uB85C \uC791\uB3D9\uD558\uC9C0
    \uC54A\uAC70\uB098, \uAE30\uAE30\uB97C \uB5A8\uC5B4\uB728\uB9AC\uB294 \uB4F1 \uAE30\uAE30\uAC00 \uC5B4\uB5A4 \uBC29\uC2DD\uC73C\uB85C\uB4E0 \uC190\uC0C1\uB41C \uACBD\uC6B0 \uC11C\uBE44\uC2A4\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.</li>
  <li>\uC774 \uC81C\uD488\uC740 "Class 2" \uB610\uB294 "LPS" \uB610\uB294 "PS2"\uB85C \uD45C\uC2DC\uB418\uACE0 PoE(48Vdc), 0.23A \uB4F1\uAE09\uC758 UL \uC778\uC99D \uC804\uC6D0 \uACF5\uAE09 \uC7A5\uCE58\uC5D0\uC11C \uACF5\uAE09\uB418\uB3C4\uB85D \uC124\uACC4\uB418\uC5C8\uC2B5\uB2C8\uB2E4. (XNV-A9084RS)</li>
  <li>\uC774 \uC81C\uD488\uC740 "Class 2" \uB610\uB294 "LPS" \uB610\uB294 "PS2"\uB85C \uD45C\uC2DC\uB418\uACE0 PoE(48Vdc), 0.2A \uB4F1\uAE09\uC758 UL \uC778\uC99D \uC804\uC6D0 \uACF5\uAE09 \uC7A5\uCE58\uC5D0\uC11C \uACF5\uAE09\uB418\uB3C4\uB85D \uC124\uACC4\uB418\uC5C8\uC2B5\uB2C8\uB2E4. (XNV-A8084RS)</li>
  <li>\uC774 \uC81C\uD488\uC740 \uC808\uC5F0 \uC804\uC6D0\uC73C\uB85C \uACF5\uAE09\uB418\uB3C4\uB85D \uC124\uACC4\uB418\uC5C8\uC2B5\uB2C8\uB2E4.</li>
  <li>\uC81C\uD488 \uC124\uCE58 \uC2DC \uACFC\uB3C4\uD55C \uD798\uC744 \uAC00\uD558\uBA74 \uCE74\uBA54\uB77C\uAC00 \uC190\uC0C1\uB418\uC5B4 \uACE0\uC7A5\uC774 \uB0A0 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
  <li>\uD654\uD559 \uBB3C\uC9C8\uC774\uB098 \uC624\uC77C \uBBF8\uC2A4\uD2B8\uAC00 \uC874\uC7AC\uD558\uAC70\uB098 \uBC1C\uC0DD\uD560 \uC218 \uC788\uB294 \uC7A5\uC18C\uC5D0 \uC81C\uD488\uC744 \uC124\uCE58\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624. \uB300\uB450\uC720\uC640 \uAC19\uC740 \uC2DD\uC6A9\uC720\uB294 \uC81C\uD488\uC744 \uC190\uC0C1\uC2DC\uD0A4\uAC70\uB098 \uB4A4\uD2C0\uB9AC\uAC8C \uD560 \uC218 \uC788\uC73C\uBBC0\uB85C \uC8FC\uBC29\uC774\uB098 \uC8FC\uBC29 \uD14C\uC774\uBE14 \uADFC\uCC98\uC5D0 \uC81C\uD488\uC744 \uC124\uCE58\uD558\uC9C0
    \uB9C8\uC2ED\uC2DC\uC624.</li>
  <li>\uC81C\uD488 \uC124\uCE58 \uC2DC \uC81C\uD488 \uD45C\uBA74\uC774 \uD654\uD559 \uBB3C\uC9C8\uB85C \uC624\uC5FC\uB418\uC9C0 \uC54A\uB3C4\uB85D \uC8FC\uC758\uD558\uC2ED\uC2DC\uC624. \uC138\uC815\uC81C\uB098 \uC811\uCC29\uC81C\uC640 \uAC19\uC740 \uC77C\uBD80 \uD654\uD559 \uC6A9\uC81C\uB294 \uC81C\uD488 \uD45C\uBA74\uC5D0 \uC2EC\uAC01\uD55C \uC190\uC0C1\uC744 \uC904 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
  <li>\uAD8C\uC7A5\uD558\uC9C0 \uC54A\uB294 \uBC29\uC2DD\uC73C\uB85C \uC81C\uD488\uC744 \uC124\uCE58/\uBD84\uD574\uD560 \uACBD\uC6B0 \uC81C\uD488\uC758 \uAE30\uB2A5/\uC131\uB2A5\uC774 \uBCF4\uC7A5\uB418\uC9C0 \uC54A\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
  <li>\uBB3C\uC18D\uC5D0\uC11C \uC81C\uD488\uC744 \uC124\uCE58\uD558\uAC70\uB098 \uC0AC\uC6A9\uD558\uBA74 \uC81C\uD488\uC5D0 \uC2EC\uAC01\uD55C \uC190\uC0C1\uC744 \uC904 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
  <li>\uAE09\uACA9\uD55C \uC628\uB3C4 \uBCC0\uD654\uB85C \uC778\uD574 \uB3D4 \uB0B4\uBD80\uC5D0 \uC11C\uB9AC\uAC00 \uC0DD\uAE38 \uC218 \uC788\uC73C\uB098, \uC601\uC0C1\uC5D0\uB294 \uBB38\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</li>
  <li>\uBCF8 \uAE30\uAE30\uB294 STP \uCF00\uC774\uBE14\uC744 \uC0AC\uC6A9\uD558\uC5EC \uAC80\uC99D\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uACFC\uB3C4 \uC804\uC555, \uB099\uB8B0, \uD1B5\uC2E0 \uC911\uB2E8\uC73C\uB85C\uBD80\uD130 \uC81C\uD488\uACFC \uC7AC\uC0B0\uC744 \uD6A8\uACFC\uC801\uC73C\uB85C \uBCF4\uD638\uD558\uAE30 \uC704\uD574 \uC801\uC808\uD55C GND \uC811\uC9C0\uC640 STP \uCF00\uC774\uBE14 \uC0AC\uC6A9\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.</li>
  <li>XNV-A9084RS/XNV-A8084RS \uC81C\uD488\uC758 \uC791\uB3D9 \uC628\uB3C4\uB294 -40\xB0C ~ +50\xB0C(-40\xB0F ~ +122\xB0F)\uC785\uB2C8\uB2E4.</li>
</ol>

<h3>\uACBD\uACE0 / \uC8FC\uC758</h3>
<table class="type2">
  <tbody>
    <tr>
      <td><img src="./images/1.png" alt="\uBC88\uAC1C \uAE30\uD638"></td>
      <td>
        <h3>\uC8FC\uC758</h3>
        <p>\uAC10\uC804 \uC704\uD5D8.<br>\uC5F4\uC9C0 \uB9C8\uC2ED\uC2DC\uC624.</p>
      </td>
      <td><img src="./images/2.png" alt="\uB290\uB08C\uD45C \uAE30\uD638"></td>
    </tr>
    <tr>
      <td colspan="3">
        <p>\uC8FC\uC758: \uAC10\uC804 \uC704\uD5D8\uC744 \uC904\uC774\uB824\uBA74 \uB36E\uAC1C\uB97C \uC81C\uAC70\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624. \uB0B4\uBD80\uC5D0\uB294 \uC0AC\uC6A9\uC790\uAC00 \uC218\uB9AC\uD560 \uC218 \uC788\uB294 \uBD80\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC11C\uBE44\uC2A4\uB294 \uC790\uACA9\uC744 \uAC16\uCD98 \uC11C\uBE44\uC2A4 \uB2F4\uB2F9\uC790\uC5D0\uAC8C \uC758\uB8B0\uD558\uC2ED\uC2DC\uC624.</p>
      </td>
    </tr>
  </tbody>
</table>

<h3>\uADF8\uB798\uD53D \uAE30\uD638 \uC124\uBA85</h3>
<ul>
  <li>\uBC88\uAC1C \uD45C\uC2DC: \uC0AC\uC6A9\uC790\uC5D0\uAC8C "\uC704\uD5D8\uD55C \uC804\uC555"\uC774 \uC788\uC74C\uC744 \uACBD\uACE0\uD569\uB2C8\uB2E4.</li>
  <li>\uB290\uB08C\uD45C \uD45C\uC2DC: \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC911\uC694\uD55C \uC6B4\uC601 \uBC0F \uC720\uC9C0\uBCF4\uC218 \uC9C0\uCE68\uC774 \uC788\uC74C\uC744 \uACBD\uACE0\uD569\uB2C8\uB2E4.</li>
</ul>

<h3>\uBC30\uD130\uB9AC \uBC0F \uC804\uC6D0 \uC548\uC804</h3>
<p>\uBC30\uD130\uB9AC\uB294 \uD587\uBE5B, \uBD88 \uB4F1\uACFC \uAC19\uC740 \uACFC\uB3C4\uD55C \uC5F4\uC5D0 \uB178\uCD9C\uB418\uC9C0 \uC54A\uC544\uC57C \uD569\uB2C8\uB2E4. \uBC30\uD130\uB9AC\uB294 \uAD50\uCCB4\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.</p>
<h4>\uBC30\uD130\uB9AC \uC624\uC6A9 \uAE08\uC9C0:</h4>
<ul>
  <li>\uC798\uBABB\uB41C \uC720\uD615\uC758 \uBC30\uD130\uB9AC\uB97C \uC124\uCE58\uD558\uAC70\uB098 \uC0AC\uC6A9\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624.</li>
  <li>\uAE30\uACC4\uC801\uC73C\uB85C \uC555\uCC29\uD558\uAC70\uB098 \uC808\uB2E8\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624. \uD3ED\uBC1C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
  <li>\uACE0\uC628 \uD658\uACBD\uC5D0 \uBC29\uCE58\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624.</li>
  <li>\uC800\uC555 \uD658\uACBD\uC5D0 \uBC29\uCE58\uD558\uC9C0 \uB9C8\uC2ED\uC2DC\uC624.</li>
</ul>

<h2>\uAD8C\uC7A5 \uC0AC\uC591</h2>

<h3>\uAD8C\uC7A5 PC \uC0AC\uC591</h3>
<ul>
  <li>CPU: Intel(R) Core(TM) i7 3.4 GHz \uC774\uC0C1</li>
  <li>RAM: 8G \uC774\uC0C1</li>
  <li>\uAD8C\uC7A5 \uBE0C\uB77C\uC6B0\uC800: Chrome</li>
  <li>\uC9C0\uC6D0 OS: Windows, Mac, Linux, Android, iOS, Chrome</li>
</ul>

<h3>\uAD8C\uC7A5 Micro SD \uCE74\uB4DC \uC0AC\uC591</h3>
<ul>
  <li>Hanwha Vision \uBA54\uBAA8\uB9AC \uCE74\uB4DC: SPP-E128G, SPP-E256G, SPP-E512G, SPP-E10T</li>
  <li>\uAD8C\uC7A5 \uC6A9\uB7C9: 16 GB ~ 1 TB (MLC \uD0C0\uC785 \uAD8C\uC7A5)</li>
</ul>

<h3>NAS \uAD8C\uC7A5 \uC0AC\uC591</h3>
<ul>
  <li>\uAD8C\uC7A5 \uC6A9\uB7C9: 200GB \uC774\uC0C1 \uAD8C\uC7A5.</li>
  <li>\uAD8C\uC7A5 \uC81C\uC870\uC0AC: QNAP NAS, Synology NAS</li>
</ul>

<h2>\uC124\uCE58\uC6A9 \uC120\uD0DD \uC561\uC138\uC11C\uB9AC</h2>
<table class="type1">
  <thead>
    <tr>
      <th>\uBAA8\uB378\uBA85</th>
      <th>\uBCBD\uBD80\uD615 \uBC0F \uD3F4 \uB9C8\uC6B4\uD2B8</th>
      <th>\uCC9C\uC7A5\uD615 \uB9C8\uC6B4\uD2B8</th>
      <th>\uCF54\uB108 \uB9C8\uC6B4\uD2B8</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        XNV-A9084RS<br>
        XNV-A8084RS
      </td>
      <td>
        <div class="grid">
          <div>
            <img src="images/SBP-300WMS.png" alt="SBP-300WMS">
            <p>SBP-300WMS<br>(\uBCBD\uBD80\uD615 \uB9C8\uC6B4\uD2B8)</p>
          </div>
          <div>
            <img src="images/SBP-300WMS1.png" alt="SBP-300WMS1">
            <p>SBP-300WMS1<br>(\uBCBD\uBD80\uD615 \uB9C8\uC6B4\uD2B8)</p>
          </div>
          <div>
            <img src="images/SBP-300PMS.png" alt="SBP-300PMS">
            <p>SBP-300PMS<br>(\uD3F4 \uB9C8\uC6B4\uD2B8)</p>
          </div>
        </div>
      </td>
      <td>
        <img src="images/SBP-300PMS.png" alt="\uCC9C\uC7A5\uD615 \uB9C8\uC6B4\uD2B8">
        <p>SBP-180HMS</p>
      </td>
      <td>
        <img src="images/SBP-300KMS.png" alt="SBP-300KMS">
        <p>SBP-300KMS</p>
      </td>
    </tr>
  </tbody>
</table>

<h2>\uC124\uCE58 \uBC0F \uC5F0\uACB0</h2>
<h3>\uAD6C\uC131\uD488</h3>
<table>
  <tbody>
    <tr>
      <td colspan="3"><img src="images/XNV-AX084RS.png" alt="Main Components"></td>
    </tr>
    <tr>
      <td><img src="images/XNV-AX084RS1.png" alt="Component 1"></td>
      <td><img src="images/XNV-6081Z-QG.png" alt="Component 2"></td>
      <td><img src="images/XNF-A9014RV.png" alt="Cables"></td>
    </tr>
  </tbody>
</table>

<ul>
  <li>\uCE74\uBA54\uB77C \uB80C\uC988\uC758 \uBAA8\uC591\uC740 \uBAA8\uB378\uBA85\uC5D0 \uB530\uB77C \uB2E4\uB97C \uC218 \uC788\uC2B5\uB2C8\uB2E4.</li>
  <li>\uC81C\uD488 \uC124\uCE58 \uC2DC \uCD5C\uC18C M4, L30 \uC774\uC0C1\uC758 \uC124\uCE58 \uB098\uC0AC\uB97C \uC0AC\uC6A9\uD558\uC2ED\uC2DC\uC624.</li>
</ul>
  `,
    en: `
    <h2>Important Safety Instructions</h2>
<ol>
  <li>Read these instructions.</li>
  <li>Keep these instructions.</li>
  <li>Heed all warnings.</li>
  <li>Follow all instructions.</li>
  <li>Do not use this apparatus near water.</li>
  <li>Clean the contaminated area on the product surface with a soft, dry cloth or a damp cloth. (Do not use a detergent
    or cosmetic products that contain alcohol, solvents or surfactants or oil constituents as they may deform or cause
    damage to the product.)</li>
  <li>Do not block any ventilation openings, Install in accordance with the manufacturer\u2019s instructions.</li>
  <li>Do not install near any heat sources such as radiators, heat registers, stoves, or other apparatus (including
    amplifiers) that produce heat.</li>
  <li>Do not defeat the safety purpose of the polarized or grounding-type plug. A polarized plug has two blades with one
    wider than the other. A grounding type plug has two blades and a third grounding prong. The wide blade or the third
    prong are provided for your safety. If the provided plug does not fit into your outlet, consult an electrician for
    replacement of the obsolete outlet.</li>
  <li>Protect the power cord from being walked on or pinched particularly at plugs, convenience receptacles, and the
    point where they exit from the apparatus.</li>
  <li>Only use attachments/ accessories specified by the manufacturer.</li>
  <li>Use only with the cart, stand, tripod, bracket, or table specified by the manufacturer, or sold with the
    apparatus. When a cart is used, use caution when moving the cart/apparatus combination to avoid injury from
    tip-over.</li>
  <li>Unplug this apparatus during lighting storms or when unused for long periods of time.</li>
  <li>Refer all servicing to qualified service personnel. Servicing is required when the apparatus has been damaged in
    any way, such as power-supply cord or plug is damaged, liquid has been spilled or objects have fallen into the
    apparatus, the apparatus has been exposed to rain or moisture, does not operate normally, or has been dropped.</li>
  <li>This product is intended to be supplied by a UL Listed Power Supply Unit marked \u201CClass 2\u201D or \u201CLPS\u201D or \u201CPS2\u201D and
    rated from PoE (48Vdc), 0.23A. (XNV-A9084RS)</li>
  <li>This product is intended to be supplied by a UL Listed Power Supply Unit marked \u201CClass 2\u201D or \u201CLPS\u201D or \u201CPS2\u201D and
    rated from PoE (48Vdc), 0.2A. (XNV-A8084RS)</li>
  <li>This product is intended to be supplied by isolation power.</li>
  <li>If you use excessive force when installing the product, the camera may be damaged and malfunction.</li>
  <li>Do not install the product in a place where chemical substances or oil mist exists or may be generated.</li>
  <li>When installing the product, be careful not to allow the surface of the product to be stained with chemical
    substance.</li>
  <li>If you install/disassemble the product in a manner that has not been recommended, the production
    functions/performance may not be guaranteed.</li>
  <li>Installing or using the product in water can cause serious damage to the product.</li>
  <li>Although a rapid change in temperature could cause frost inside the dome, there will be no problem with the video.
  </li>
  <li>This device has been verified using STP cable. The use of appropriate GND grounding and STP cable is recommended.
  </li>
  <li>The operating temperature for the XNV-A9084RS/XNV-A8084RS products is -40\xB0C to +50\xB0C(-40\xB0F to +122\xB0F).</li>
</ol>

<h3>WARNING / CAUTION</h3>
<table class="type2">
  <tbody>
    <tr>
      <td><img src="./images/1.png" alt="Lightning Bolt Symbol"></td>
      <td>
        <h3>CAUTION</h3>
        <p>RISK OF ELECTRIC SHOCK.<br>DO NOT OPEN</p>
      </td>
      <td><img src="./images/2.png" alt="Exclamation Symbol"></td>
    </tr>
    <tr>
      <td colspan="3">
        <p>CAUTION: TO REDUCE THE RISK OF ELECTRIC SHOCK, DO NOT REMOVE COVER. NO USER SERVICEABLE PARTS INSIDE. REFER
          SERVICING TO QUALIFIED SERVICE PERSONNEL.</p>
      </td>
    </tr>
  </tbody>
</table>

<h3>EXPLANATION OF GRAPHICAL SYMBOLS</h3>
<ul>
  <li>Lightning flash: Alert the user to \u201Cdangerous voltage\u201D.</li>
  <li>Exclamation point: Alert the user to important operating and maintenance instructions.</li>
</ul>

<h3>Battery and Power Safety</h3>
<p>Batteries shall not be exposed to excessive heat. The battery cannot be replaced.</p>
<h4>Prohibition of battery abuse:</h4>
<ul>
  <li>Do not install wrong type of battery.</li>
  <li>Do not mechanically crush or cut.</li>
  <li>Do not leave in high temperature or low-pressure environment.</li>
</ul>

<h2>Recommended Specifications</h2>

<h3>Recommended PC Specifications</h3>
<ul>
  <li>CPU: Intel(R) Core(TM) i7 3.4 GHz or higher</li>
  <li>RAM: 8G or higher</li>
  <li>Recommended browser: Chrome</li>
  <li>Supported OS: Windows, Mac, Linux, Android, iOS, Chrome</li>
</ul>

<h3>Recommended Micro SD Card Specifications</h3>
<ul>
  <li>Hanwha Vision Memory Card: SPP-E128G, SPP-E256G, SPP-E512G, SPP-E10T</li>
  <li>Recommended capacity: 16 GB ~ 1 TB (MLC type recommended)</li>
</ul>

<h3>NAS Recommended Specs</h3>
<ul>
  <li>Recommended capacity: 200GB or higher.</li>
  <li>Recommended manufacturers: QNAP NAS, Synology NAS</li>
</ul>

<h2>Optional Accessories for Installation</h2>
<table class="type1">
  <thead>
    <tr>
      <th>Model name</th>
      <th>Wall Mount and Pole Mount</th>
      <th>Hanging Mount</th>
      <th>Corner Mount</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        XNV-A9084RS<br>
        XNV-A8084RS
      </td>
      <td>
        <div class="grid">
          <div>
            <img src="images/SBP-300WMS.png" alt="SBP-300WMS">
            <p>SBP-300WMS<br>(Wall Mount)</p>
          </div>
          <div>
            <img src="images/SBP-300WMS1.png" alt="SBP-300WMS1">
            <p>SBP-300WMS1<br>(Wall Mount)</p>
          </div>
          <div>
            <img src="images/SBP-300PMS.png" alt="SBP-300PMS">
            <p>SBP-300PMS<br>(Pole Mount)</p>
          </div>
        </div>
      </td>
      <td>
        <img src="images/SBP-300PMS.png" alt="Pole Mount">
        <p>SBP-180HMS</p>
      </td>

      <td>
        <img src="images/SBP-300KMS.png" alt="SBP-300KMS">
        <p>SBP-300KMS</p>
      </td>
    </tr>
  </tbody>
</table>

<h2>installation &amp; connection</h2>
<h3>What's Included</h3>
<table>
  <tbody>
    <tr>
      <td colspan="3"><img src="images/XNV-AX084RS.png" alt="Main Components"></td>
    </tr>
    <tr>
      <td><img src="images/XNV-AX084RS1.png" alt="Component 1"></td>
      <td><img src="images/XNV-6081Z-QG.png" alt="Component 2"></td>
      <td><img src="images/XNF-A9014RV.png" alt="Cables"></td>
    </tr>
  </tbody>
</table>

<ul>
  <li>The shape of the camera lens may differ depending on the model names.</li>
  <li>Use installation screws of at least M4, L30.</li>
</ul>
  `
  };

  // js/loadContent.js
  async function loadContent(lang, initTOC2, searchManager2) {
    try {
      const newHtml = docsData[lang];
      if (!newHtml) throw new Error("\uB370\uC774\uD130\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
      const content = document.getElementById("content");
      const contentInner = document.querySelector(".content-inner");
      contentInner.innerHTML = newHtml;
      content.scrollTop = 0;
      requestAnimationFrame(() => {
        if (searchManager2) searchManager2.refresh();
        initTOC2({
          contentSelector: ".content-inner",
          menuSelector: "#menu"
        });
      });
    } catch (error) {
      console.error("\uB85C\uB4DC \uC2E4\uD328:", error);
    }
  }

  // js/Responsive.js
  var Responsive = () => {
    const sidebar = document.getElementById("sidebar");
    const menuBtn = document.getElementById("mobileMenuBtn");
    const overlay = document.getElementById("overlay");
    const toggleSidebar = () => {
      sidebar.classList.toggle("open");
      overlay.classList.toggle("active");
    };
    menuBtn.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", toggleSidebar);
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768) {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      }
    });
  };

  // js/manual.js
  var refreshTOC = () => {
    initTOC({
      contentSelector: ".content-inner",
      menuSelector: "#menu"
    });
  };
  var searchManager = initSearch({
    contentSelector: ".content-inner",
    inputSelector: "#search",
    countSelector: "#count",
    onReset: refreshTOC
    // ★ 리셋될 때마다 TOC 다시 그리기
  });
  var runLoad = (lang) => loadContent(lang, initTOC, searchManager);
  langSelect.addEventListener("change", (e) => runLoad(e.target.value));
  runLoad("ko");
  Responsive();
})();
