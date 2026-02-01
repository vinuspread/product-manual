import { initTOC } from "./js/Toc.js";
import { initSearch } from "./js/Search.js";
import { loadContent } from "./js/loadContent.js";
import { Responsive } from "./js/Responsive.js";

// TOC 초기화 함수를 정의 (재사용을 위해)
const refreshTOC = () => {
  initTOC({
    contentSelector: ".content-inner",
    menuSelector: "#menu",
  });
};

const searchManager = initSearch({
  contentSelector: ".content-inner",
  inputSelector: "#search",
  countSelector: "#count",
  onReset: refreshTOC, // ★ 리셋될 때마다 TOC 다시 그리기
});

// 초기 로드 및 언어 변경 시 searchManager 전달은 기존과 동일
const runLoad = (lang) => loadContent(lang, initTOC, searchManager);
langSelect.addEventListener("change", (e) => runLoad(e.target.value));
runLoad("ko");
Responsive();
