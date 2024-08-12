document.addEventListener("DOMContentLoaded", () => {
  const update_create = document.getElementById("update_create");
  const update = document.getElementById("update");
  const create = document.getElementById("create");

  const update_id = document.getElementById("update_id");
  const updateSpecific = document.getElementById("updateSpecific");

  const remove_article_id = document.getElementById("remove_article_id");
  const deleteArticle = document.getElementById("delete");

  const output = document.getElementById("output");

  const originalConsoleLog = console.log;

  // Override console.log
  console.log = function (message) {
    // Call the original console.log function
    originalConsoleLog.apply(console, arguments);

    // Append the message to the output div
    if (output) {
      output.textContent += Array.from(arguments).join(" ") + "\n";
    }
  };

  
  async function FetchLogs() {
    console.debug("looking for event replies");
    fetch("/events", { method: "POST" })
      .then((response) => {
        if (response.ok) {
          return response.text();
        }
      })
      .then((resp) => {
        if (resp) {
          output.innerHTML += resp;
        }
      })
      .catch((error) => {
        console.error('Fetch error:', error);
      });
  }

  //update and create articles
  update_create.addEventListener("click", () => {
    const interval_ID = setInterval(FetchLogs, 100);
    DisableButtons(true);

    fetch("/update&Create", { method: "POST" })
      .then((response) => {
        return response.text();
      })
      .then((resp) => {
        console.log(resp);
        return new Promise((resolve) => setTimeout(resolve, 5000));
      })
      .catch((error) =>
        console.error("Error updating and creating articles:", error)
      )
      .finally(() => {
        clearInterval(interval_ID);
        DisableButtons(false);
      });
  });

  //only udpate articles
  update.addEventListener("click", async () => {
    const interval_ID = setInterval(FetchLogs, 100);
    DisableButtons(true);

    fetch("/updateOnly", { method: "POST" })
      .then((response) => {
        return response.text();
      })
      .then((resp) => {
        console.log(resp);
        return new Promise((resolve) => setTimeout(resolve, 3000));
      })
      .catch((error) => console.error("Error updating articles:", error))
      .finally(() => {
        clearInterval(interval_ID);
        DisableButtons(false);
      });
  });

  //only create articles
  create.addEventListener("click", () => {
    const interval_ID = setInterval(FetchLogs, 100);
    DisableButtons(true);

    fetch("/createOnly", { method: "POST" })
      .then((response) => {
        return response.text();
      })
      .then((resp) => {
        console.log(resp);
        return new Promise((resolve) => setTimeout(resolve, 3000));
      })
      .catch((error) => console.error("Error creating articles:", error))
      .finally(() => {
        clearInterval(interval_ID);
        DisableButtons(false);
      });
  });

  //update only specified articles
  updateSpecific.addEventListener("click", () => {
    const inputValue = update_id.value;
    if (!inputValue) {
      alert(`PLEASE ENTER VALUE `);
      output.textContent = "";
      return new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      const interval_ID = setInterval(FetchLogs, 100);
      DisableButtons(true);

      fetch(`/updateSpecific/${inputValue}`, { method: "POST" })
        .then((response) => {
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
          clearInterval(interval_ID);
          DisableButtons(false);
        });
    }
  });

  //remove article from intercom
  deleteArticle.addEventListener("click", () => {
    const inputValue = remove_article_id.value;
    if (!inputValue) {
      alert(`PLEASE ENTER VALUE `);
      return new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      const interval_ID = setInterval(FetchLogs, 100);
      DisableButtons(true);

      output.textContent += `${inputValue}`;
      fetch(`/removeSpecific/${inputValue}`, { method: "POST" })
        .then((response) => {
          return response.text();
        })
        .then((resp) => {
          console.log(resp);
          return new Promise((resolve) => setTimeout(resolve, 3000));
        })
        .catch((error) =>
          console.error("Error trying to delete article", error)
        )
        .finally(() => {
          clearInterval(interval_ID);
          DisableButtons(false);
        });
    }
  });

  function DisableButtons(state) {
    //console.log('something happened');
    update_create.disabled = state;
    update.disabled = state;
    create.disabled = state;
    updateSpecific.disabled = state;
    deleteArticle.disabled = state;
  }
});
