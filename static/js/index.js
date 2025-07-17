(function () {
  "use strict";

  window.onload = function () {
    const [currentImageKey, getCurrentImage, setCurrentImage] =
      meact.useState(null);
    const [imageCountKey, getImageCount, setImageCount] = meact.useState(0);
    const [currentIndexKey, getIndex, setIndex] = meact.useState(0);
    const [commentPageKey, getCommentPage, setCommentPage] = meact.useState(0);
    const [currentUserKey, getCurrentUser, setCurrentUser] =
      meact.useState(null);

    const [
      currentGalleryUserKey,
      getCurrentGalleryUser,
      setCurrentGalleryUser,
    ] = meact.useState(null);
    const [galleryUsersCountKey, getGalleryUsersCount, setGalleryUsersCount] =
      meact.useState(0);
    const [
      currentGalleryIndexKey,
      getCurrentGalleryIndex,
      setCurrentGalleryIndex,
    ] = meact.useState(0);

    setupToggleFormButton();
    setupAddImageForm();
    setupGalleryControls();
    setupGalleryNavigation();
    setupCommentForm();
    setupCommentPagination();
    checkUserAuthentication();
    initializeGalleries();

    meact.useEffect(() => {
      renderCurrentImage();
    }, [currentImageKey, currentIndexKey, currentUserKey]);

    meact.useEffect(() => {
      renderComments();
    }, [
      currentImageKey,
      currentIndexKey,
      commentPageKey,
      currentUserKey,
      currentGalleryUserKey,
    ]);

    function checkUserAuthentication() {
      apiService
        .getCurrentUser()
        .then((user) => {
          setCurrentUser(user);
          updateAuthUI(user);
          if (user) {
            apiService.getGalleryUserByIndex(0).then(() => {
              findUserGalleryIndex(user.id);
            });
          }
        })
        .catch(() => {
          setCurrentUser(null);
          updateAuthUI(null);
        });
    }

    function findUserGalleryIndex(userId) {
      let userCount = 0;
      let currentIndex = 0;

      apiService.getGalleryUsersCount().then((count) => {
        userCount = count;
        return checkUserAtIndex(0);
      });

      function checkUserAtIndex(index) {
        if (index >= userCount) {
          return;
        }

        return apiService.getGalleryUserByIndex(index).then((user) => {
          if (user.userId === userId) {
            setCurrentGalleryIndex(index);
            loadCurrentGalleryUser();
          } else {
            return checkUserAtIndex(index + 1);
          }
        });
      }
    }

    function updateAuthUI(user) {
      const headerAuthContainer = document.querySelector(".auth-container");

      if (!headerAuthContainer) return;

      if (user) {
        headerAuthContainer.innerHTML = `
          <span class="username-display">Hello, ${user.username}</span>
          <button id="logout-button" class="btn">Logout</button>
        `;

        document
          .querySelector("#logout-button")
          .addEventListener("click", function () {
            apiService.logout().then(() => {
              setCurrentUser(null);
              updateAuthUI(null);
              renderCurrentImage();
              renderComments();
            });
          });
      } else {
        headerAuthContainer.innerHTML = `
          <a href="login.html" class="btn">Login / Sign Up</a>
        `;
      }

      const toggleAddImageBtn = document.querySelector("#toggle-add-image");
      const addImageSection = document.querySelector("#add-image-section");

      if (toggleAddImageBtn) {
        const currentGalleryUser = getCurrentGalleryUser();
        const currentUser = getCurrentUser();

        if (
          user &&
          currentGalleryUser &&
          user.id === currentGalleryUser.userId
        ) {
          toggleAddImageBtn.classList.remove("hidden");
          toggleAddImageBtn.textContent = "Show Add Image";
          toggleAddImageBtn.setAttribute("data-state", "hidden");

          addImageSection.classList.add("hidden");
          addImageSection.classList.remove("visible");
        } else {
          toggleAddImageBtn.classList.add("hidden");
          addImageSection.classList.remove("visible");
          addImageSection.classList.add("hidden");
        }
      }

      updateCommentsVisibility(user);
    }

    function updateCommentsVisibility(user) {
      const commentsSection = document.querySelector("#comments-section");
      if (!commentsSection) return;

      if (user) {
        if (commentsSection.classList.contains("hidden") && getCurrentImage()) {
          commentsSection.classList.remove("hidden");
          commentsSection.classList.add("visible");
          renderComments();
        }
      } else {
        commentsSection.classList.remove("visible");
        commentsSection.classList.add("hidden");
      }
    }

    function initializeGalleries() {
      showImageLoading();
      apiService
        .getGalleryUsersCount()
        .then((count) => {
          setGalleryUsersCount(count);
          if (count > 0) {
            setCurrentGalleryIndex(0);
            return loadCurrentGalleryUser();
          } else {
            setCurrentGalleryUser(null);
            setCurrentImage(null);
            hideLoading("#image-display");
            renderCurrentImage();
            return null;
          }
        })
        .catch((err) => {
          hideLoading("#image-display");
        });
    }

    function loadCurrentGalleryUser() {
      const galleryIndex = getCurrentGalleryIndex();

      return apiService
        .getGalleryUserByIndex(galleryIndex)
        .then((user) => {
          setCurrentGalleryUser(user);
          return loadCurrentGalleryImages(user.userId);
        })
        .catch((err) => {
          console.error("Failed to load gallery user:", err);
          setCurrentGalleryUser(null);
          return null;
        });
    }

    function loadCurrentGalleryImages(userId) {
      return apiService.getUserImagesCount(userId).then((count) => {
        setImageCount(count);
        setIndex(0);

        if (count > 0) {
          return loadCurrentImage();
        } else {
          setCurrentImage(null);
          hideLoading("#image-display");
          renderCurrentImage();
          return null;
        }
      });
    }

    function setupGalleryNavigation() {
      document.querySelector("#prev-gallery").addEventListener("click", () => {
        const galleryIndex = getCurrentGalleryIndex();
        const count = getGalleryUsersCount();
        if (count === 0) return;

        const newIndex = (galleryIndex - 1 + count) % count;
        setCurrentGalleryIndex(newIndex);
        showImageLoading();
        document.querySelector("#comment-list").innerHTML = "";
        loadCurrentGalleryUser()
          .then(() => {
            setCommentPage(0);
          })
          .finally(() => hideLoading("#image-display"));
      });

      document.querySelector("#next-gallery").addEventListener("click", () => {
        const galleryIndex = getCurrentGalleryIndex();
        const count = getGalleryUsersCount();
        if (count === 0) return;

        const newIndex = (galleryIndex + 1) % count;
        setCurrentGalleryIndex(newIndex);
        showImageLoading();
        document.querySelector("#comment-list").innerHTML = "";
        loadCurrentGalleryUser()
          .then(() => {
            setCommentPage(0);
          })
          .finally(() => hideLoading("#image-display"));
      });
    }

    function showImageLoading() {
      const display = document.querySelector("#image-display");
      if (!display.querySelector(".loading")) {
        display.innerHTML = "<div class='loading'></div>";
      }
    }

    function showCommentsLoading() {
      const commentList = document.querySelector("#comment-list");
      commentList.innerHTML = "<div class='loading'></div>";
    }

    function hideLoading(selector) {
      const container = document.querySelector(selector || "#image-display");
      const loading = container.querySelector(".loading");
      if (loading) {
        loading.remove();
      }
    }

    function refreshImageCount() {
      const currentGalleryUser = getCurrentGalleryUser();
      if (!currentGalleryUser) return Promise.resolve(0);

      showImageLoading();
      return apiService
        .getUserImagesCount(currentGalleryUser.userId)
        .then((count) => {
          setImageCount(count);
          return count;
        })
        .finally(() => hideLoading("#image-display"));
    }

    function loadCurrentImage() {
      const index = getIndex();
      const count = getImageCount();
      const currentGalleryUser = getCurrentGalleryUser();

      if (count === 0 || !currentGalleryUser) {
        setCurrentImage(null);
        return Promise.resolve(null);
      }

      if (index >= 0 && index < count) {
        showImageLoading();
        return apiService
          .getUserImageByIndex(currentGalleryUser.userId, index)
          .then(function (image) {
            setCurrentImage(image);
            return image;
          })
          .catch(function (err) {
            setCurrentImage(null);
            return null;
          })
          .finally(function () {
            hideLoading("#image-display");
          });
      } else {
        setCurrentImage(null);
        return Promise.resolve(null);
      }
    }

    function setupToggleFormButton() {
      const toggleBtn = document.querySelector("#toggle-add-image");
      const addImageSection = document.querySelector("#add-image-section");
      addImageSection.classList.add("hidden");
      addImageSection.classList.remove("visible");
      toggleBtn.textContent = "Show Add Image";
      toggleBtn.setAttribute("data-state", "hidden");

      toggleBtn.addEventListener("click", function () {
        if (addImageSection.classList.contains("hidden")) {
          addImageSection.classList.remove("hidden");
          addImageSection.classList.add("visible");
          toggleBtn.textContent = "Hide Add Image";
          toggleBtn.setAttribute("data-state", "visible");
        } else {
          addImageSection.classList.remove("visible");
          addImageSection.classList.add("hidden");
          toggleBtn.textContent = "Show Add Image";
          toggleBtn.setAttribute("data-state", "hidden");
        }
      });
    }

    function setupAddImageForm() {
      document
        .querySelector("#add-image-form")
        .addEventListener("submit", function (e) {
          e.preventDefault();

          const title = document.querySelector("#image-title").value.trim();
          const file = document.querySelector("#image-file").files[0];

          if (!title || !file) return;

          showImageLoading();
          apiService
            .addImage(title, file)
            .then(() => {
              return apiService.getCurrentUser();
            })
            .then((user) => {
              if (user) {
                return apiService
                  .getGalleryUserByIndex(0)
                  .then(() => initializeGalleries());
              }
              return null;
            })
            .finally(() => {
              e.target.reset();
              hideLoading("#image-display");
            });
        });
    }

    function setupGalleryControls() {
      document.querySelector("#prev-image").addEventListener("click", () => {
        const index = getIndex();
        const count = getImageCount();
        if (count === 0) return;

        const newIndex = (index - 1 + count) % count;
        setIndex(newIndex);
        showImageLoading();
        document.querySelector("#comment-list").innerHTML = "";
        loadCurrentImage()
          .then(() => {
            setCommentPage(0);
            renderComments();
          })
          .finally(() => hideLoading("#image-display"));
      });

      document.querySelector("#next-image").addEventListener("click", () => {
        const index = getIndex();
        const count = getImageCount();
        if (count === 0) return;

        const newIndex = (index + 1) % count;
        setIndex(newIndex);
        showImageLoading();
        document.querySelector("#comment-list").innerHTML = "";
        loadCurrentImage()
          .then(() => {
            setCommentPage(0);
            renderComments();
          })
          .finally(() => hideLoading("#image-display"));
      });

      document
        .querySelector("#delete-image")
        .addEventListener("click", function () {
          const currentImage = getCurrentImage();
          if (!currentImage) return;

          const currentUser = getCurrentUser();
          if (!currentUser || currentImage.userId !== currentUser.id) {
            alert("You can only delete your own images");
            return;
          }

          const currentIndex = getIndex();
          const isLastImage = currentIndex === getImageCount() - 1;

          showImageLoading();

          apiService
            .deleteImage(currentImage.imageId)
            .then(() => {
              return refreshImageCount();
            })
            .then((newCount) => {
              if (newCount === 0) {
                setCurrentImage(null);
                setIndex(0);
                renderCurrentImage();
                return null;
              } else {
                const newIndex =
                  isLastImage && newCount > 0
                    ? Math.min(currentIndex, newCount - 1)
                    : currentIndex;
                setIndex(Math.max(0, newIndex));
                return loadCurrentImage();
              }
            })
            .then(() => {
              setCommentPage(0);
            })
            .finally(() => hideLoading("#image-display"));
        });
    }

    function setupCommentForm() {
      const oldForm = document.querySelector("#add-comment-form");
      const newForm = oldForm.cloneNode(true);
      oldForm.parentNode.replaceChild(newForm, oldForm);

      const oldCommentList = document.querySelector("#comment-list");
      const newCommentList = oldCommentList.cloneNode(true);
      oldCommentList.parentNode.replaceChild(newCommentList, oldCommentList);

      newForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const user = getCurrentUser();

        const content = document.querySelector("#comment-text").value.trim();
        const currentImage = getCurrentImage();

        if (!content || !currentImage) return;

        showCommentsLoading();

        apiService
          .addComment(currentImage.imageId, content)
          .then(() => {
            e.target.reset();
            setCommentPage(0);
            renderComments();
          })
          .catch((err) => {
            console.error("Failed to add comment:", err);
            renderComments();
          });
      });

      document
        .querySelector("#comment-list")
        .addEventListener("click", function (e) {
          if (e.target.classList.contains("delete-comment")) {
            const commentId = e.target.getAttribute("data-id");
            const commentUserId = e.target.getAttribute("data-user-id");
            const currentUser = getCurrentUser();
            const currentImage = getCurrentImage();

            if (!currentUser) {
              alert("You must be logged in to delete comments");
              return;
            }

            const isCommentOwner =
              currentUser.id.toString() === commentUserId.toString();
            const isGalleryOwner =
              currentUser.id.toString() === currentImage.userId.toString();

            if (!isCommentOwner && !isGalleryOwner) {
              alert(
                "You can only delete your own comments or comments on your gallery"
              );
              return;
            }

            showCommentsLoading();

            apiService
              .deleteComment(commentId)
              .then(() => {
                const currentPage = getCommentPage();
                return apiService.getCommentsForImage(
                  currentImage.imageId,
                  currentPage,
                  10
                );
              })
              .then((response) => {
                if (response.comments.length === 0 && getCommentPage() > 0) {
                  setCommentPage(0);
                }
                renderComments();
              })
              .catch(() => {
                renderComments();
              });
          }
        });
    }

    function setupCommentPagination() {
      document
        .querySelector("#comment-pagination")
        .addEventListener("click", handlePaginationClick);

      document
        .querySelector("#comment-top-pagination")
        .addEventListener("click", handlePaginationClick);

      function handlePaginationClick(e) {
        if (e.target.classList.contains("prev-icon")) {
          const currentPage = getCommentPage();
          const currentImage = getCurrentImage();
          if (!currentImage) return;

          apiService
            .getCommentsForImage(currentImage.imageId, 0, 10)
            .then((response) => {
              const totalPages = Math.ceil(response.totalCount / 10);

              if (totalPages > 1) {
                const newPage =
                  currentPage === 0 ? totalPages - 1 : currentPage - 1;
                setCommentPage(newPage);
                renderComments();
              }
            });
        } else if (e.target.classList.contains("next-icon")) {
          const currentPage = getCommentPage();
          const currentImage = getCurrentImage();
          if (!currentImage) return;

          apiService
            .getCommentsForImage(currentImage.imageId, 0, 10)
            .then((response) => {
              const totalPages = Math.ceil(response.totalCount / 10);

              if (totalPages > 1) {
                const newPage =
                  currentPage === totalPages - 1 ? 0 : currentPage + 1;
                setCommentPage(newPage);
                renderComments();
              }
            });
        }
      }
    }

    function renderComments() {
      const commentList = document.querySelector("#comment-list");
      const currentImage = getCurrentImage();
      const page = getCommentPage();
      const currentUser = getCurrentUser();

      commentList.innerHTML = "";

      if (!currentImage) {
        return;
      }

      if (!currentUser) {
        commentList.innerHTML =
          "<p class='login-message'>Please <a href='login.html'>login</a> to view and post comments</p>";
        return;
      }

      showCommentsLoading();

      const requestedImageId = currentImage.imageId;

      apiService
        .getCommentsForImage(requestedImageId, page, 10)
        .then(function (response) {
          if (response.error) {
            throw new Error(response.error);
          }

          const comments = response.comments;
          const totalCount = response.totalCount;

          const currentImage = getCurrentImage();
          if (!currentImage || currentImage.imageId !== requestedImageId) {
            return;
          }

          commentList.innerHTML = "";

          if (comments.length === 0) {
            const noCommentsMsg = document.createElement("div");
            noCommentsMsg.className = "no-comments-message";
            noCommentsMsg.textContent =
              "No comments yet! Be the first to add to the conversation";
            commentList.appendChild(noCommentsMsg);
          } else {
            comments.forEach(function (comment) {
              const div = document.createElement("div");
              div.className = "comment";
              const currentUser = getCurrentUser();
              const canDelete =
                currentUser &&
                (String(currentUser.id) === String(comment.userId) ||
                  String(currentUser.id) === String(currentImage.userId));

              div.innerHTML = `
                <strong class="comment-author">${
                  comment.author
                }</strong> <em class="comment-date">${new Date(
                comment.date
              ).toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}</em>
                <p class="comment-content">${comment.content}</p>
                ${
                  canDelete
                    ? `<button class="delete-comment" data-id="${comment.commentId}" data-user-id="${comment.userId}" title="Delete comment"></button>`
                    : ""
                }
              `;
              commentList.appendChild(div);
            });
          }

          renderCommentPagination(
            document.querySelector("#comment-pagination"),
            totalCount,
            10,
            page
          );

          renderCommentPagination(
            document.querySelector("#comment-top-pagination"),
            totalCount,
            10,
            page
          );
        })
        .catch(function (err) {
          commentList.innerHTML =
            "<p class='error-message'>Failed to load comments. Please try again later.</p>";
        })
        .finally(function () {
          hideLoading("#comment-list");
        });
    }

    function renderCommentPagination(
      paginationContainer,
      totalComments,
      commentsPerPage,
      currentPage
    ) {
      paginationContainer.innerHTML = "";

      if (totalComments <= commentsPerPage) {
        return;
      }

      const totalPages = Math.max(
        1,
        Math.ceil(totalComments / commentsPerPage)
      );

      const prevButton = document.createElement("button");
      prevButton.className = "icon-button prev-icon";
      prevButton.title = "Previous page";

      const pageInfo = document.createElement("span");
      pageInfo.className = "page-info";
      pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;

      const nextButton = document.createElement("button");
      nextButton.className = "icon-button next-icon";
      nextButton.title = "Next page";

      paginationContainer.appendChild(prevButton);
      paginationContainer.appendChild(pageInfo);
      paginationContainer.appendChild(nextButton);
    }

    function renderCurrentImage() {
      const count = getImageCount();
      const index = getIndex();
      const currentImage = getCurrentImage();
      const galleryUser = getCurrentGalleryUser();
      const galleryCount = getGalleryUsersCount();
      const galleryIndex = getCurrentGalleryIndex();
      const currentUser = getCurrentUser();

      const display = document.querySelector("#image-display");
      const counter = document.querySelector("#image-counter");
      const galleryCounter = document.querySelector("#gallery-counter");
      const galleryOwner = document.querySelector("#gallery-owner");
      const infoContainer = document.querySelector("#image-info-container");
      const titleDisplay = document.querySelector("#image-title-display");
      const authorDisplay = document.querySelector("#image-author-display");
      const commentsSection = document.querySelector("#comments-section");
      const prevButton = document.querySelector("#prev-image");
      const nextButton = document.querySelector("#next-image");
      const prevGalleryButton = document.querySelector("#prev-gallery");
      const nextGalleryButton = document.querySelector("#next-gallery");

      display.innerHTML = "";

      if (galleryCount <= 1) {
        prevGalleryButton.classList.add("hidden");
        prevGalleryButton.classList.remove("inline-visible");
        nextGalleryButton.classList.add("hidden");
        nextGalleryButton.classList.remove("inline-visible");
      } else {
        prevGalleryButton.classList.remove("hidden");
        prevGalleryButton.classList.add("inline-visible");
        nextGalleryButton.classList.remove("hidden");
        nextGalleryButton.classList.add("inline-visible");
      }

      if (galleryUser) {
        galleryCounter.textContent = `Gallery ${
          galleryIndex + 1
        } of ${galleryCount}`;
        galleryOwner.textContent = `${galleryUser.username}'s Gallery`;

        const toggleAddImageBtn = document.querySelector("#toggle-add-image");
        const addImageSection = document.querySelector("#add-image-section");

        if (toggleAddImageBtn) {
          if (currentUser && galleryUser.userId === currentUser.id) {
            toggleAddImageBtn.classList.remove("hidden");

            addImageSection.classList.add("hidden");
            addImageSection.classList.remove("visible");
            toggleAddImageBtn.textContent = "Show Add Image";
            toggleAddImageBtn.setAttribute("data-state", "hidden");
          } else {
            toggleAddImageBtn.classList.add("hidden");
            addImageSection.classList.remove("visible");
            addImageSection.classList.add("hidden");
          }
        }
      } else {
        galleryCounter.textContent = "";
        galleryOwner.textContent = "";
      }

      if (count === 0 || !currentImage) {
        if (galleryUser) {
          if (currentUser && galleryUser.userId === currentUser.id) {
            display.innerHTML = `<p class='empty-message'>Your gallery is empty. Add your first image!</p>`;
          } else {
            display.innerHTML = `<p class='empty-message'>${galleryUser.username}'s gallery is empty.</p>`;
          }
        } else {
          display.innerHTML =
            "<p class='empty-message'>No galleries found.</p>";
        }

        counter.textContent = "";
        infoContainer.classList.add("hidden");
        infoContainer.classList.remove("visible");
        commentsSection.classList.add("hidden");
        commentsSection.classList.remove("visible");
        return;
      }

      if (infoContainer.classList.contains("hidden")) {
        infoContainer.classList.remove("hidden");
        infoContainer.classList.add("visible");

        if (currentUser) {
          commentsSection.classList.remove("hidden");
          commentsSection.classList.add("visible");
        } else {
          commentsSection.classList.add("hidden");
          commentsSection.classList.remove("visible");
        }
      }

      const deleteButton = document.querySelector("#delete-image");
      if (currentUser && currentImage.userId === currentUser.id) {
        deleteButton.classList.remove("hidden");
      } else {
        deleteButton.classList.add("hidden");
      }

      if (count <= 1) {
        prevButton.classList.add("hidden");
        prevButton.classList.remove("inline-visible");
        nextButton.classList.add("hidden");
        nextButton.classList.remove("inline-visible");
        counter.textContent = "Image 1 of 1";
      } else {
        prevButton.classList.remove("hidden");
        prevButton.classList.add("inline-visible");
        nextButton.classList.remove("hidden");
        nextButton.classList.add("inline-visible");
        counter.textContent = `Image ${index + 1} of ${count}`;
      }

      const imgElement = new Image();
      imgElement.className = "gallery-image gallery-img";
      imgElement.alt = currentImage.title;

      display.innerHTML = "<div class='loading'>Loading...</div>";

      imgElement.onload = function () {
        const loadedImage = getCurrentImage();
        if (loadedImage && loadedImage.imageId === currentImage.imageId) {
          display.innerHTML = "";
          display.appendChild(imgElement);
        }
      };

      imgElement.onerror = function () {
        if (getIndex() === index) {
          display.innerHTML =
            "<p class='empty-message'>Failed to load image</p>";
        }
      };

      imgElement.src = `/api/images/${currentImage.imageId}/file`;
      titleDisplay.textContent = currentImage.title;
      authorDisplay.textContent = `by ${currentImage.author}`;

      const dateElement = document.querySelector("#image-date-display");
      if (dateElement) {
        if (currentImage.date) {
          const formattedDate = new Date(currentImage.date).toLocaleString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }
          );
          dateElement.textContent = formattedDate;
          dateElement.classList.remove("hidden");
          dateElement.classList.add("visible");
        } else {
          dateElement.classList.remove("visible");
          dateElement.classList.add("hidden");
        }
      }
    }
  };
})();
