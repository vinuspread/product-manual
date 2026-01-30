import { loadContent } from "./js/loadContent.js";
import { initTOC } from "./js/toc.js";
import { initSearch } from "./js/Search.js";
import { Responsive } from "./js/Responsive.js";

const langSelect = document.getElementById("langSelect");

// 1. 검색 기능 먼저 초기화하여 매니저 객체 확보
const searchManager = initSearch({
  contentSelector: ".content-inner",
  inputSelector: "#search",
  countSelector: "#count",
});

// 2. 초기 로드 (매니저 전달)
loadContent("ko", initTOC, searchManager);

// 3. 언어 변경 이벤트
langSelect.addEventListener("change", (e) => {
  loadContent(e.target.value, initTOC, searchManager);
});

// 4. 반응형 기능 실행
Responsive();
