// Цветы стартуют снятием класса not-loaded; надпись печатается посимвольно.
// Последний «символ» — смайлик, который печатается как часть текста.

window.onload = () => {
    setTimeout(() => {
      // 1) запуск анимации цветов
      document.body.classList.remove("not-loaded");
  
      // 2) запуск печати
      startTypewriter({
        parts: [
          "i"," ","m","i","s","s"," ","u", " ",
          "<img src='img/sticker.webp' alt='sticker' class='emoji-inline'>"
        ],
        delayBeforeStart: 600, // мс после снятия not-loaded
        msPerPart: 170,        // скорость печати (увеличь для медленнее)
        stopBlinkOnFinish: false
      });
    }, 300);
  };
  
  /**
   * Пишущая машинка, поддерживающая текст и HTML (например, <img>).
   */
  function startTypewriter({
    parts,
    msPerPart = 120,
    delayBeforeStart = 0,
    stopBlinkOnFinish = false
  }) {
    const typed = document.getElementById("typed");
    const message = typed?.parentElement;
    const caret = message?.querySelector(".caret");
    if (!typed || !message || !caret) return;
  
    // прижать курсор к тексту
    caret.classList.add("tight");
  
    setTimeout(() => {
      message.classList.add("ready");
  
      let i = 0;
      const step = () => {
        if (i < parts.length) {
          typed.innerHTML += parts[i++];
          setTimeout(step, msPerPart);
        } else if (stopBlinkOnFinish) {
          caret.style.animation = "none";
          caret.style.opacity = "1";
        }
      };
      step();
    }, delayBeforeStart);
  }