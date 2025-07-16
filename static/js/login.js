(function () {
  "use strict";

  window.onload = function () {
    const loginTab = document.querySelector("#login-tab");
    const signupTab = document.querySelector("#signup-tab");
    const loginFormContainer = document.querySelector("#login-form-container");
    const signupFormContainer = document.querySelector(
      "#signup-form-container"
    );
    const loginForm = document.querySelector("#login-form");
    const signupForm = document.querySelector("#signup-form");
    const loginError = document.querySelector("#login-error");
    const signupError = document.querySelector("#signup-error");
    const signupSuccess = document.querySelector("#signup-success");

    apiService
      .getCurrentUser()
      .then((user) => {
        if (user) {
          window.location.href = "index.html";
        }
      })
      .catch(() => {});

    loginTab.addEventListener("click", function () {
      loginTab.classList.add("active");
      signupTab.classList.remove("active");
      loginFormContainer.classList.remove("hidden");
      loginFormContainer.classList.add("visible");
      signupFormContainer.classList.remove("visible");
      signupFormContainer.classList.add("hidden");
      resetMessages();
    });

    signupTab.addEventListener("click", function () {
      signupTab.classList.add("active");
      loginTab.classList.remove("active");
      signupFormContainer.classList.remove("hidden");
      signupFormContainer.classList.add("visible");
      loginFormContainer.classList.remove("visible");
      loginFormContainer.classList.add("hidden");
      resetMessages();
    });

    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document.querySelector("#login-username").value.trim();
      const password = document.querySelector("#login-password").value;

      if (!username || !password) {
        showErrorMessage(
          loginError,
          "Please provide both username and password"
        );
        return;
      }

      apiService
        .login(username, password)
        .then(() => {
          window.location.href = "index.html";
        })
        .catch((err) => {
          const errorMessage =
            err.error || "Login failed. Please check your credentials.";
          showErrorMessage(loginError, errorMessage);
        });
    });

    signupForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document.querySelector("#signup-username").value.trim();
      const password = document.querySelector("#signup-password").value;
      const confirmPassword = document.querySelector(
        "#signup-confirm-password"
      ).value;

      if (!username || !password) {
        showErrorMessage(
          signupError,
          "Please provide both username and password"
        );
        return;
      }

      if (password !== confirmPassword) {
        showErrorMessage(signupError, "Passwords do not match");
        return;
      }

      apiService
        .signup(username, password)
        .then(() => {
          signupForm.reset();
          showSuccessMessage(
            signupSuccess,
            "Account created successfully! You can now login."
          );
          setTimeout(() => {
            loginTab.click();
          }, 1000);
        })
        .catch((err) => {
          const errorMessage = err.error || "Signup failed. Please try again.";
          showErrorMessage(signupError, errorMessage);
        });
    });

    function showErrorMessage(element, message) {
      element.textContent = message;
      element.classList.remove("hidden");
    }

    function showSuccessMessage(element, message) {
      element.textContent = message;
      element.classList.remove("hidden");
    }

    function resetMessages() {
      loginError.classList.add("hidden");
      signupError.classList.add("hidden");
      signupSuccess.classList.add("hidden");
    }
  };
})();
