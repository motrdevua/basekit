export default function modal() {
  const openModal = document.querySelectorAll('[data-modal-route]');

  function clickHandler(e) {
    e.preventDefault();
    console.log(this);
  }

  openModal.forEach((button, i) => {
    console.log(i);
    button.addEventListener('click', clickHandler);
  });
}
