// export async function loadContent(lang, initTOC, searchManager) {
//   try {
//     const response = await fetch(`./docs/${lang}.html`);
//     if (!response.ok) throw new Error("파일 로드 실패");

//     const newHtml = await response.text();
//     const content = document.getElementById("content");
//     const contentInner = document.querySelector(".content-inner");

//     contentInner.innerHTML = newHtml;

//     content.scrollTop = 0;

//     requestAnimationFrame(() => {
//       if (searchManager) {
//         searchManager.refresh();
//       }

//       initTOC({
//         contentSelector: ".content-inner",
//         menuSelector: "#menu",
//       });
//     });

//     document.getElementById("sidebar").classList.remove("open");
//     document.getElementById("overlay").classList.remove("active");
//   } catch (error) {
//     console.error("로드 중 오류:", error);
//   }
// }

import { docsData } from "./docsData.js";

export async function loadContent(lang, initTOC, searchManager) {
  try {
    const newHtml = docsData[lang];
    if (!newHtml) throw new Error("데이터를 찾을 수 없습니다.");

    const content = document.getElementById("content");
    const contentInner = document.querySelector(".content-inner");

    contentInner.innerHTML = newHtml;
    content.scrollTop = 0;

    requestAnimationFrame(() => {
      if (searchManager) searchManager.refresh();
      initTOC({
        contentSelector: ".content-inner",
        menuSelector: "#menu",
      });
    });
  } catch (error) {
    console.error("로드 실패:", error);
  }
}
