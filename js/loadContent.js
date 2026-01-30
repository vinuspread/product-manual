export async function loadContent(lang, initTOC, searchManager) {
  try {
    const response = await fetch(`./docs/${lang}.html`);
    if (!response.ok) throw new Error("파일을 찾을 수 없습니다.");

    const newHtml = await response.text();
    const content = document.getElementById("content");
    const contentInner = document.querySelector(".content-inner");

    // 1. 본문 교체
    contentInner.innerHTML = newHtml;

    // 2. 스크롤 초기화 (맨 위로)
    if (content) {
      content.scrollTop = 0;
    }

    // 3. TOC 메뉴 초기화 및 재생성
    const menu = document.getElementById("menu");
    if (menu) menu.innerHTML = "";
    initTOC({
      contentSelector: ".content-inner",
      menuSelector: "#menu",
    });

    // 4. 검색 기능 재동기화 (검색어 유지 여부는 선택, 여기서는 리셋)
    if (searchManager) {
      searchManager.refresh();
    }

    // 모바일인 경우 페이지 로드 후 사이드바 닫기
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  } catch (error) {
    console.error("로드 실패:", error);
    document.querySelector(".content-inner").innerHTML =
      "<p>문서를 불러오지 못했습니다.</p>";
  }
}
