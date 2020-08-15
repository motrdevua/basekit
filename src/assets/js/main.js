window.addEventListener("load", function () {
  const burger = document.querySelector(".menu__burger");

  burger.addEventListener("click", function (e) {
    e.preventDefault();
    this.classList.toggle("active");
  });
});
