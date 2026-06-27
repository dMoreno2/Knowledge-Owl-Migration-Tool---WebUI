document.addEventListener("DOMContentLoaded", () => {
  const update_create = document.getElementById("update_create");
  const update = document.getElementById("update");
  const create = document.getElementById("create");
  const exportIntercom = document.getElementById("exportIntercom");
  const update_id = document.getElementById("updateSpecific_id");
  const updateSpecific = document.getElementById("updateSpecific");
  const remove_article_id = document.getElementById("remove_article_id");
  const deleteArticle = document.getElementById("delete");
  const create_article_id = document.getElementById("createSpecific_id");
  const createSpecific = document.getElementById("createSpecific");
  const output = document.getElementById("output");

  setInterval(FetchLogs, 200);
  setInterval(scrollToBottom, 50);

  // Redirect to login on session expiry — called after every response
  function checkAuth(response) {
    if (response.status === 401) {
      window.location.href = '/login';
      return false;
    }
    return true;
  }

  async function FetchLogs() {
    try {
      const response = await fetch("/events", { method: "POST" });
      if (!checkAuth(response)) return;
      const resp = await response.text();
      if (resp) output.innerHTML += ` ${resp}`;
    } catch (error) {
      console.debug("FetchLogs error:", error);
    }
  }

  update_create.addEventListener("click", () => {
    DisableButtons(true);
    fetch("/update&Create", { method: "POST" })
      .then((response) => {
        if (!checkAuth(response)) return;
        return response.text();
      })
      .catch((error) => console.error("Error updating and creating articles:", error))
      .finally(() => DisableButtons(false));
  });

  update.addEventListener("click", () => {
    DisableButtons(true);
    fetch("/updateOnly", { method: "POST" })
      .then((response) => {
        if (!checkAuth(response)) return;
        return response.text();
      })
      .catch((error) => console.error("Error updating articles:", error))
      .finally(() => DisableButtons(false));
  });

  create.addEventListener("click", () => {
    DisableButtons(true);
    fetch("/createOnly", { method: "POST" })
      .then((response) => {
        if (!checkAuth(response)) return;
        return response.text();
      })
      .catch((error) => console.error("Error creating articles:", error))
      .finally(() => DisableButtons(false));
  });

  createSpecific.addEventListener("click", () => {
    const inputValue = create_article_id.value;
    if (!inputValue) {
      alert("PLEASE ENTER VALUE");
      return;
    }
    DisableButtons(true);
    fetch(`/createSpecific/${inputValue}`, { method: "POST" })
      .then((response) => {
        if (!checkAuth(response)) return;
        return response.text();
      })
      .catch((error) => console.error("Error creating article:", error))
      .finally(() => DisableButtons(false));
  });

  updateSpecific.addEventListener("click", () => {
    const inputValue = update_id.value;
    if (!inputValue) {
      alert("PLEASE ENTER VALUE");
      return;
    }
    DisableButtons(true);
    fetch(`/updateSpecific/${inputValue}`, { method: "POST" })
      .then((response) => {
        if (!checkAuth(response)) return;
        return response.text();
      })
      .catch((error) => console.error("Error updating article:", error))
      .finally(() => DisableButtons(false));
  });

  exportIntercom.addEventListener("click", () => {
    DisableButtons(true);
    fetch("/exportIntercom")
      .then((response) => {
        if (!checkAuth(response)) return;
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "intercom-articles.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((error) => console.error("Export error:", error))
      .finally(() => DisableButtons(false));
  });

  deleteArticle.addEventListener("click", () => {
    const inputValue = remove_article_id.value;
    if (!inputValue) {
      alert("PLEASE ENTER VALUE");
      return;
    }
    alert("Delete not implemented.");
  });

  function scrollToBottom() {
    if (output) output.scrollTop = output.scrollHeight;
  }

  function DisableButtons(state) {
    update_create.disabled = state;
    update.disabled = state;
    create.disabled = state;
    updateSpecific.disabled = state;
    createSpecific.disabled = state;
    deleteArticle.disabled = state;
    exportIntercom.disabled = state;
  }
});
