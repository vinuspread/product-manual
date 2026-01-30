export const Responsive = () => {
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("mobileMenuBtn");
  const overlay = document.getElementById("overlay");

  // 메뉴 열기/닫기
  const toggleSidebar = () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("active");
  };

  menuBtn.addEventListener("click", toggleSidebar);
  overlay.addEventListener("click", toggleSidebar);

  // 창 크기 변경 시 초기화
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768) {
      sidebar.classList.remove("open");
      overlay.classList.remove("active");
    }
  });
};
