export async function loadContent(lang, initTOC, searchManager) {
  try {
    const response = await fetch(`./docs/${lang}.html`);
    if (!response.ok) throw new Error("파일 로드 실패");

    const newHtml = await response.text();
    const content = document.getElementById("content");
    const contentInner = document.querySelector(".content-inner");

    // 1. HTML 주입
    contentInner.innerHTML = newHtml;

    // 2. 스크롤 즉시 상단 이동
    content.scrollTop = 0;

    // 3. 브라우저가 새로운 DOM의 레이아웃을 계산할 시간을 줍니다.
    // requestAnimationFrame은 다음 화면 프레임이 그려지기 직전에 실행됩니다.
    requestAnimationFrame(() => {
      // 4. 검색 데이터(원본 HTML 스냅샷) 업데이트
      if (searchManager) {
        searchManager.refresh();
      }

      // 5. TOC 초기화 (헤딩들이 DOM에 안착된 후 실행)
      initTOC({
        contentSelector: ".content-inner",
        menuSelector: "#menu",
      });
    });

    // 모바일 대응
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("overlay").classList.remove("active");
  } catch (error) {
    console.error("로드 중 오류:", error);
  }
}
