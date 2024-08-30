function toggleLeftOverlay() {
  var overlay = document.getElementById("time-panel");
  var leftBurgerBtn = document.querySelector(".left-burger-btn");
  var currentDisplay = overlay.style.display;
  // Toggle the visibility based on the current state
  overlay.style.display = currentDisplay === "block" ? "none" : "block";
  leftBurgerBtn.style.marginLeft = currentDisplay === "block" ? "0" : "10em";
}

// window on ready
$(window).ready(function () {
  $("#loader").fadeOut("slow");

  $("#nextTimeSwitcher input").on("click", function () {
    if ($("#nextTimeSwitcher input:checked").val() === "on") {
      localStorage.setItem("popState", "shown");
    } else {
      localStorage.setItem("popState", "notShown");
    }
  });

  if (localStorage.getItem("popState") != "shown") {
    console.log("show welcome panel");
    $("#welcome").modal("show");
  } else {
    console.log("hide welcome panel");
    $("#welcome").modal("hide");
  }
  $("#welcome-close").click(function (
    e // You are clicking the close button
  ) {
    $("#welcome").fadeOut(); // Now the pop up is hiden.
    $("#welcome").modal("hide");
  });
});

$(".showFrontPage").on("click", function () {
  $("#welcome").modal("show");
  localStorage.setItem("popState", "notShown");
});
