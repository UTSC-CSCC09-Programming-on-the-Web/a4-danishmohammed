let apiService = (function () {
  "use strict";
  let module = {};

  const BASE_IMAGE_URL = "/api/images";
  const BASE_COMMENT_URL = "/api/comments";
  const BASE_USER_URL = "/api/users";

  module.getGalleryUsersCount = function () {
    return fetch(`${BASE_IMAGE_URL}/users/count`)
      .then((res) => res.json())
      .then((data) => data.count);
  };

  module.getGalleryUserByIndex = function (index) {
    return fetch(`${BASE_IMAGE_URL}/users/by-index/${index}`).then((res) =>
      res.json()
    );
  };

  module.getUserImagesCount = function (userId) {
    return fetch(`${BASE_IMAGE_URL}/users/${userId}/count`)
      .then((res) => res.json())
      .then((data) => data.count);
  };

  module.getUserImageByIndex = function (userId, index) {
    return fetch(`${BASE_IMAGE_URL}/users/${userId}/by-index/${index}`).then(
      (res) => res.json()
    );
  };

  module.getImageCount = function () {
    return fetch(`${BASE_IMAGE_URL}/count`)
      .then((res) => res.json())
      .then((data) => data.count);
  };

  module.getImageByIndex = function (index) {
    return fetch(`${BASE_IMAGE_URL}/by-index/${index}`).then((res) =>
      res.json()
    );
  };

  module.addImage = function (title, file) {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", file);

    return fetch(BASE_IMAGE_URL, {
      method: "POST",
      credentials: "same-origin",
      body: formData,
    }).then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw data;
        });
      }
      return res.json();
    });
  };

  module.deleteImage = function (imageId) {
    return fetch(`${BASE_IMAGE_URL}/${imageId}`, {
      method: "DELETE",
      credentials: "same-origin",
    }).then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw data;
        });
      }
      return res.json();
    });
  };

  module.getCommentsForImage = function (imageId, page = 0, limit = 10) {
    return fetch(
      `${BASE_COMMENT_URL}/image/${imageId}?page=${page}&limit=${limit}`,
      {
        credentials: "same-origin",
      }
    )
      .then((res) => res.json())
      .catch((err) => {
        console.error("Comments fetch error:", err);
        return {
          error: "Failed to load comments",
          comments: [],
          totalCount: 0,
        };
      });
  };

  module.addComment = function (imageId, content) {
    return fetch(BASE_COMMENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ imageId, content }),
    }).then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw data;
        });
      }
      return res.json();
    });
  };

  module.deleteComment = function (commentId) {
    return fetch(`${BASE_COMMENT_URL}/${commentId}`, {
      method: "DELETE",
      credentials: "same-origin",
    }).then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw data;
        });
      }
      return res.json();
    });
  };

  module.signup = function (username, password) {
    return fetch(`${BASE_USER_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password }),
    }).then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw data;
        });
      }
      return res.json();
    });
  };

  module.login = function (username, password) {
    return fetch(`${BASE_USER_URL}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, password }),
    }).then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw data;
        });
      }
      return res.json();
    });
  };

  module.logout = function () {
    return fetch(`${BASE_USER_URL}/signout`, {
      method: "GET",
      credentials: "same-origin",
    }).then((res) => res.json());
  };

  module.getCurrentUser = function () {
    return fetch(`${BASE_USER_URL}/me`, {
      credentials: "same-origin",
    }).then((res) => {
      if (!res.ok) {
        throw new Error("Not authenticated");
      }
      return res.json();
    });
  };

  return module;
})();
