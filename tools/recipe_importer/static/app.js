const form = document.querySelector("#recipe-form");
const urlsInput = document.querySelector("#urls");
const notesInput = document.querySelector("#notes");
const pauseReviewInput = document.querySelector("#pause-review");
const submitButton = document.querySelector("#submit-button");
const urlCount = document.querySelector("#url-count");
const connection = document.querySelector("#connection");
const connectionLabel = document.querySelector("#connection-label");
const repositoryLabel = document.querySelector("#repository-label");
const refreshButton = document.querySelector("#refresh-button");
const taskList = document.querySelector("#task-list");
const resultPanel = document.querySelector("#result-panel");
const resultTitle = document.querySelector("#result-title");
const resultMessage = document.querySelector("#result-message");
const resultLink = document.querySelector("#result-link");

const stateLabels = {
  queued: "Queued",
  in_progress: "In progress",
  completed: "Completed",
  failed: "Failed",
  idle: "Waiting",
  waiting_for_user: "Needs input",
  timed_out: "Timed out",
  cancelled: "Cancelled",
};

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function recipeUrls() {
  return urlsInput.value
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);
}

function updateUrlCount() {
  const count = new Set(recipeUrls()).size;
  urlCount.textContent = `${count} / 5`;
  urlCount.style.color = count > 5 ? "var(--error)" : "";
}

function setConnection(kind, label) {
  connection.className = `connection ${kind}`;
  connectionLabel.textContent = label;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload;
}

async function loadStatus() {
  try {
    const status = await requestJson("/api/status");
    repositoryLabel.textContent = status.repository;
    if (!status.ready) {
      setConnection("error", "Setup needed");
      submitButton.disabled = true;
      return;
    }
    if (status.workflow !== "active") {
      setConnection("error", "Auto-merge paused");
      return;
    }
    setConnection("ready", "Ready");
  } catch (error) {
    setConnection("error", "Offline");
  }
}

function formatDate(value) {
  if (!value) {
    return "Recently";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function createTaskCard(task) {
  const link = document.createElement("a");
  link.className = "task-card";
  link.href = task.html_url || task.htmlUrl || "https://github.com/copilot/agents";
  link.target = "_blank";
  link.rel = "noreferrer";

  const state = task.state || "idle";
  const stateDot = document.createElement("span");
  stateDot.className = `task-state ${state}`;
  stateDot.setAttribute("aria-label", stateLabels[state] || state);

  const content = document.createElement("div");
  content.className = "task-content";
  const title = document.createElement("strong");
  title.textContent = task.name || "Recipe import";
  const meta = document.createElement("div");
  meta.className = "task-meta";
  const stateText = document.createElement("span");
  stateText.textContent = stateLabels[state] || state.replaceAll("_", " ");
  const separator = document.createElement("span");
  separator.textContent = "•";
  const date = document.createElement("span");
  date.textContent = formatDate(task.updated_at || task.updatedAt || task.created_at || task.createdAt);
  meta.append(stateText, separator, date);
  content.append(title, meta);

  const arrow = document.createElement("i");
  arrow.dataset.lucide = "chevron-right";
  arrow.setAttribute("aria-hidden", "true");
  link.append(stateDot, content, arrow);
  return link;
}

async function loadTasks() {
  refreshButton.classList.add("loading");
  refreshButton.disabled = true;
  try {
    const payload = await requestJson("/api/tasks");
    taskList.replaceChildren();
    if (!payload.tasks.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "No recipe imports yet.";
      taskList.append(emptyState);
    } else {
      payload.tasks.slice(0, 8).forEach((task) => taskList.append(createTaskCard(task)));
    }
    renderIcons();
  } catch (error) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = error.message;
    taskList.replaceChildren(emptyState);
  } finally {
    refreshButton.classList.remove("loading");
    refreshButton.disabled = false;
  }
}

function setResult(kind, title, message, link = null) {
  resultPanel.hidden = false;
  resultPanel.className = `result-panel entrance ${kind}`;
  resultTitle.textContent = title;
  resultMessage.textContent = message;
  resultLink.hidden = !link;
  if (link) {
    resultLink.href = link;
  }

  const icon = resultPanel.querySelector(".result-icon");
  const iconName = kind === "busy" ? "loader-circle" : kind === "error" ? "circle-alert" : "circle-check";
  icon.replaceChildren();
  const iconElement = document.createElement("i");
  iconElement.dataset.lucide = iconName;
  iconElement.setAttribute("aria-hidden", "true");
  icon.append(iconElement);
  renderIcons();
}

async function submitRecipes(event) {
  event.preventDefault();
  const urls = recipeUrls();
  if (!urls.length) {
    urlsInput.focus();
    setResult("error", "Add a recipe URL", "Enter at least one HTTP or HTTPS source.");
    return;
  }
  if (new Set(urls).size > 5) {
    urlsInput.focus();
    setResult("error", "Too many recipes", "Import up to five recipes at a time.");
    return;
  }

  submitButton.disabled = true;
  setResult("busy", "Extracting recipes", "Reading the sources, then sending the prepared data to Copilot.");
  try {
    const payload = await requestJson("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        urls,
        notes: notesInput.value,
        pauseForReview: pauseReviewInput.checked,
      }),
    });
    const names = payload.recipes.map((recipe) => recipe.title).join(", ");
    setResult("success", "Sent to Copilot", names, payload.taskUrl);
    form.reset();
    updateUrlCount();
    await loadTasks();
  } catch (error) {
    setResult("error", "Import failed", error.message);
  } finally {
    submitButton.disabled = false;
  }
}

urlsInput.addEventListener("input", updateUrlCount);
form.addEventListener("submit", submitRecipes);
refreshButton.addEventListener("click", loadTasks);

window.addEventListener("DOMContentLoaded", () => {
  renderIcons();
  updateUrlCount();
  loadStatus();
  loadTasks();
  window.setInterval(loadTasks, 30_000);
});