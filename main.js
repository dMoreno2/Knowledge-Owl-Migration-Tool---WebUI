document.addEventListener("DOMContentLoaded", () => {
  const update_create = document.getElementById("update_create");
  const update = document.getElementById("update");
  const create = document.getElementById("create");

  //update specific article
  const update_id = document.getElementById("updateSpecific_id");
  const updateSpecific = document.getElementById("updateSpecific");

  //delete specific article
  const remove_article_id = document.getElementById("remove_article_id");
  const deleteArticle = document.getElementById("delete");

  //create specific article
  const create_article_id = document.getElementById("createSpecific_id");
  const createSpecific = document.getElementById("createSpecific");

  const output = document.getElementById("output");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const retries = 3;

  try {
    setInterval(FetchLogs, 200);
    setInterval(scrollToBottom, 50);
  } catch (error) { }

  async function FetchLogs() {
    console.debug("Looking for event replies");

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch("/events", { method: "POST" });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const resp = await response.text();
        if (resp) {
          output.innerHTML += ` ${resp}`;
        }
        return; // Exit loop on success
      } catch (error) {
        console.error("Fetch error:", error);

        if (error.name === "AbortError") {
          console.warn(`Fetch aborted, retrying... (${i + 1}/${retries})`);
          continue; // Retry only on abort errors
        }
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  //update and create articles
  update_create.addEventListener("click", () => {
    DisableButtons(true);
    for (let i = 0; i < retries;) {
      try {
        fetch("/update&Create", { method: "POST" })
          .then((response) => {
            i = retries;
            return response.text();
          })
          .then((resp) => {
            return new Promise((resolve) => setTimeout(resolve, 5000));
          })
          .catch((error) =>
            console.error("Error updating and creating articles:", error)
          )
          .finally(() => {
            DisableButtons(false);
          })
        break;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Fetch aborted, retrying...', i + 1);
          continue;
        }
        throw error; // If not an AbortError, break the loop
      }
    }
  });
  //only udpate articles
  update.addEventListener("click", async () => {
    DisableButtons(true);
    for (let i = 0; i < retries;) {
      try {
        fetch("/updateOnly", { method: "POST" })
          .then((response) => {
            i = retries;
            return response.text();
          })
          .then((resp) => {
            console.log(resp);
            //return new Promise((resolve) => setTimeout(resolve, 3000));
          })
          .finally(() => {
            DisableButtons(false);
          })
          .catch((error) => console.error("Error updating articles:", error))
        break;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Fetch aborted, retrying...', i + 1);
          continue;
        }
        throw error; // If not an AbortError, break the loop
      }
    }
  });
  //only create articles
  create.addEventListener("click", () => {
    DisableButtons(true);
    for (let i = 0; i < retries;) {
      try {
        fetch("/createOnly", { method: "POST" })
          .then((response) => {
            i = retries;
            return response.text();
          })
          .then((resp) => {
            return new Promise((resolve) => setTimeout(resolve, 3000));
          })
          .catch((error) => console.error("Error creating articles:", error))
          .finally(() => {
            DisableButtons(false);
          });
        break;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('Fetch aborted, retrying...', i + 1);
          continue;
        }
        throw error; // If not an AbortError, break the loop
      }
    }
  }
  );
  //update only specified articles
  createSpecific.addEventListener("click", () => {
    const inputValue = create_article_id.value;
    if (!inputValue) {
      alert(`PLEASE ENTER VALUE `);
      output.textContent = "";
      return new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      DisableButtons(true);
      for (let i = 0; i < retries;) {
        try {
          fetch(`/createSpecific/${inputValue}`, { method: "POST" })
            .then((response) => {
              i = retries;

              return response.text();
            })
            .then((resp) => {
              console.log(resp);
              return new Promise((resolve) => setTimeout(resolve, 3000));
            })
            .catch((error) =>
              console.error("Error trying to update article", error)
            ).finally(() => {
              DisableButtons(false);
            });
          break;
        } catch (error) {
          if (error.name === 'AbortError') {
            console.error('Fetch aborted, retrying...', i + 1);
            continue;
          }
          throw error; // If not an AbortError, break the loop
        }
      }
    }
  });
  //update only specified articles
  updateSpecific.addEventListener("click", () => {
    const inputValue = update_id.value;
    if (!inputValue) {
      alert(`PLEASE ENTER VALUE `);
      output.textContent = "";
      return new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      DisableButtons(true);
      for (let i = 0; i < retries;) {
        try {
          fetch(`/updateSpecific/${inputValue}`, { method: "POST" })
            .then((response) => {
              i = retries;
              return response.text();
            })
            .then((resp) => {
              console.log(resp);
              return new Promise((resolve) => setTimeout(resolve, 3000));
            })
            .catch((error) =>
              console.error("Error trying to update article", error)
            )
            .finally(() => {
              DisableButtons(false);
            });
          break;
        } catch (error) {
          if (error.name === 'AbortError') {
            console.error('Fetch aborted, retrying...', i + 1);
            continue;
          }
          throw error; // If not an AbortError, break the loop
        }

      }
    }
  });
  //remove article from intercom
  deleteArticle.addEventListener("click", () => {
    const inputValue = remove_article_id.value;
    if (!inputValue) {
      alert(`PLEASE ENTER VALUE `);
      return new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      DisableButtons(true);
      new Promise((resolve) => setTimeout(resolve, 2000));
      alert(`NO `);
      new Promise((resolve) => setTimeout(resolve, 2000));
      DisableButtons(false);
    }
  });
  async function scrollToBottom() {
    if (output) {
      // Check if the user is already scrolled up
      output.scrollToBottom = output.scrollHeight
    }
  }
  function DisableButtons(state) {
    console.log(state);
    //console.log('something happened');
    update_create.disabled = state;
    update.disabled = state;
    create.disabled = state;
    updateSpecific.disabled = state;
    createSpecific.disabled = state;
    deleteArticle.disabled = state;
  }
});
