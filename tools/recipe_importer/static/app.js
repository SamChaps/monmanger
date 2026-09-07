const form = document.querySelector("#recipe-form");
const sourceModeInputs = document.querySelectorAll('input[name="source-mode"]');
const linkSource = document.querySelector("#link-source");
const textSource = document.querySelector("#text-source");
const urlsInput = document.querySelector("#urls");
const recipeTextInput = document.querySelector("#recipe-text");
const notesInput = document.querySelector("#notes");
const pauseReviewInput = document.querySelector("#pause-review");
const submitButton = document.querySelector("#submit-button");
const urlCount = document.querySelector("#url-count");
const connection = document.querySelector("#connection");
const connectionLabel = document.querySelector("#connection-label");
const refreshButton = document.querySelector("#refresh-button");
const taskList = document.querySelector("#task-list");
const resultPanel = document.querySelector("#result-panel");
const resultTitle = document.querySelector("#result-title");
const resultMessage = document.querySelector("#result-message");
const resultLink = document.querySelector("#result-link");

const activeStages = new Set(["queued", "preparing", "checking", "publishing"]);
const cancelableStages = new Set(["queued", "preparing", "checking", "review", "blocked"]);
const stepNames = ["Read", "Prepare", "Check", "Publish"];
let pendingSubmission = null;
let refreshTimer = null;
let loadingTasks = false;

function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function replaceIcon(container, name) {
  const icon = document.createElement("i");
  icon.dataset.lucide = name;
  icon.setAttribute("aria-hidden", "true");
  container.replaceChildren(icon);
  renderIcons();
}

function recipeUrls() {
  return urlsInput.value
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);
}

function sourceMode() {
  return document.querySelector('input[name="source-mode"]:checked').value;
}

function updateSourceMode() {
  const textMode = sourceMode() === "text";
  linkSource.hidden = textMode;
  textSource.hidden = !textMode;
  urlsInput.required = !textMode;
  recipeTextInput.required = textMode;
}

function updateUrlCount() {
  const count = new Set(recipeUrls()).size;
  urlCount.textContent = `${count} / 5`;
  urlCount.classList.toggle("over-limit", count > 5);
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
    if (!status.ready) {
      setConnection("error", "Needs setup");
      submitButton.disabled = true;
      return;
    }
    if (status.workflow !== "active") {
      setConnection("error", "Publishing paused");
      return;
    }
    setConnection("ready", "Ready");
  } catch (error) {
    setConnection("error", "Offline");
  }
}

function formatDate(value) {
  if (!value) {
    return "Just now";
  }
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return new Intl.DateTimeFormat(undefined, sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { month: "short", day: "numeric" }
  ).format(date);
}

function fallbackStage(task) {
  if (task.state === "cancelled") {
    return { key: "cancelled", label: "Canceled", step: 2, tone: "cancelled" };
  }
  if (["failed", "timed_out"].includes(task.state)) {
    return { key: "failed", label: "Could not add", step: 2, tone: "error" };
  }
  if (task.state === "completed") {
    return { key: "checking", label: "Finishing recipe", step: 3, tone: "progress" };
  }
  return { key: "preparing", label: "Preparing recipe", step: 2, tone: "progress" };
}

function createProgress(stage) {
  const progress = document.createElement("div");
  progress.className = "task-progress";
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", stage.label);
  progress.setAttribute("aria-valuemin", "1");
  progress.setAttribute("aria-valuemax", "4");
  progress.setAttribute("aria-valuenow", String(stage.step));

  for (let step = 1; step <= 4; step += 1) {
    const stepElement = document.createElement("div");
    stepElement.className = "task-step";
    const segment = document.createElement("span");
    segment.className = "task-step__bar";
    if (stage.key === "added" || step < stage.step) {
      stepElement.classList.add("is-complete");
      segment.classList.add("complete");
    } else if (step === stage.step) {
      stepElement.classList.add(
        stage.tone === "error" ? "is-error" : stage.tone === "cancelled" ? "is-cancelled" : "is-current"
      );
      segment.classList.add("current");
      if (stage.tone === "error") {
        segment.classList.add("error");
      } else if (stage.tone === "cancelled") {
        segment.classList.add("cancelled");
      }
    } else {
      stepElement.classList.add("is-upcoming");
    }
    const label = document.createElement("small");
    label.textContent = stepNames[step - 1];
    stepElement.append(segment, label);
    progress.append(stepElement);
  }
  return progress;
}

function createIconLink(url, label, iconName) {
  const link = document.createElement("a");
  link.className = "task-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.title = label;
  link.setAttribute("aria-label", label);
  const icon = document.createElement("i");
  icon.dataset.lucide = iconName;
  icon.setAttribute("aria-hidden", "true");
  link.append(icon);
  return link;
}

function createTaskCard(task) {
  const stage = task.stage || fallbackStage(task);
  const card = document.createElement("article");
  card.className = `task-card task-card--${stage.tone}`;

  const heading = document.createElement("div");
  heading.className = "task-card__heading";
  const title = document.createElement("h3");
  title.textContent = task.recipe_name || task.name || "Recipe";
  const status = document.createElement("span");
  status.className = `status status--${stage.tone}`;
  status.textContent = stage.label;
  heading.append(title, status);

  const progress = createProgress(stage);
  const footer = document.createElement("div");
  footer.className = "task-card__footer";
  const date = document.createElement("time");
  const dateValue = task.updated_at || task.updatedAt || task.created_at || task.createdAt;
  date.dateTime = dateValue || "";
  date.textContent = formatDate(dateValue);
  footer.append(date);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  if (stage.key === "review" && task.pull_url) {
    const reviewLink = document.createElement("a");
    reviewLink.className = "text-action";
    reviewLink.href = task.pull_url;
    reviewLink.target = "_blank";
    reviewLink.rel = "noreferrer";
    reviewLink.textContent = "Review";
    actions.append(reviewLink);
  }
  if (stage.key === "review" && task.pull_number) {
    const publishButton = document.createElement("button");
    publishButton.className = "publish-button";
    publishButton.type = "button";
    publishButton.dataset.pullNumber = task.pull_number;
    const icon = document.createElement("i");
    icon.dataset.lucide = "upload";
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = "Publish";
    publishButton.append(icon, label);
    publishButton.addEventListener("click", () => publishRecipe(task, publishButton));
    actions.append(publishButton);
  } else if (task.detail_url) {
    const added = stage.key === "added";
    actions.append(createIconLink(
      task.detail_url,
      added ? `Open ${task.recipe_name}` : `View progress for ${task.recipe_name}`,
      added ? "arrow-up-right" : "ellipsis"
    ));
  }
  if (cancelableStages.has(stage.key) && task.id && task.pull_number) {
    const cancelButton = document.createElement("button");
    cancelButton.className = "cancel-button";
    cancelButton.type = "button";
    cancelButton.title = `Cancel ${task.recipe_name}`;
    cancelButton.setAttribute("aria-label", `Cancel ${task.recipe_name}`);
    const icon = document.createElement("i");
    icon.dataset.lucide = "circle-x";
    icon.setAttribute("aria-hidden", "true");
    cancelButton.append(icon);
    cancelButton.addEventListener("click", () => cancelRecipe(task, cancelButton));
    actions.append(cancelButton);
  }
  footer.append(actions);

  card.append(heading, progress, footer);
  return card;
}

function optimisticTask() {
  if (!pendingSubmission) {
    return null;
  }
  return {
    ...pendingSubmission,
    stage: { key: "queued", label: "Starting", step: 1, tone: "progress" },
  };
}

function comparableRecipeName(value) {
  return (value || "")
    .toLocaleLowerCase()
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchesPendingSubmission(task) {
  if (!pendingSubmission) {
    return false;
  }
  if (task.pull_number && task.pull_number === pendingSubmission.pull_number) {
    return true;
  }
  const taskDate = new Date(task.created_at || task.createdAt || 0).getTime();
  const pendingDate = new Date(pendingSubmission.created_at).getTime();
  return Math.abs(taskDate - pendingDate) < 5 * 60 * 1000
    && comparableRecipeName(task.recipe_name || task.name)
      === comparableRecipeName(pendingSubmission.recipe_name);
}

function renderTasks(tasks) {
  const submittedTask = pendingSubmission && tasks.find(matchesPendingSubmission);
  if (submittedTask) {
    submittedTask.recipe_name = pendingSubmission.recipe_name;
    pendingSubmission = null;
  }

  const visibleTasks = [...tasks];
  const optimistic = optimisticTask();
  if (optimistic) {
    visibleTasks.unshift(optimistic);
  }

  taskList.replaceChildren();
  if (!visibleTasks.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "Your added recipes will appear here.";
    taskList.append(emptyState);
  } else {
    visibleTasks.slice(0, 8).forEach((task) => taskList.append(createTaskCard(task)));
  }
  renderIcons();
  return visibleTasks.some((task) => activeStages.has((task.stage || fallbackStage(task)).key));
}

function scheduleRefresh(hasActiveRecipes) {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(
    () => loadTasks({ quiet: true }),
    hasActiveRecipes ? 6_000 : 30_000
  );
}

async function loadTasks({ quiet = false } = {}) {
  if (loadingTasks) {
    return;
  }
  loadingTasks = true;
  if (!quiet) {
    refreshButton.classList.add("loading");
  }
  refreshButton.disabled = true;
  let hasActiveRecipes = Boolean(pendingSubmission);
  try {
    const payload = await requestJson("/api/tasks");
    hasActiveRecipes = renderTasks(payload.tasks);
  } catch (error) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state empty-state--error";
    emptyState.textContent = "Could not refresh recipes. We’ll try again shortly.";
    taskList.replaceChildren(emptyState);
  } finally {
    loadingTasks = false;
    refreshButton.classList.remove("loading");
    refreshButton.disabled = false;
    scheduleRefresh(hasActiveRecipes);
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

  const iconNames = {
    busy: "loader-circle",
    error: "circle-alert",
    progress: "clock-3",
    success: "circle-check",
  };
  replaceIcon(resultPanel.querySelector(".result-icon"), iconNames[kind] || "circle-check");
}

async function publishRecipe(task, button) {
  button.disabled = true;
  setResult("busy", `Publishing ${task.recipe_name}`, "Checking it before it goes live.");
  try {
    await requestJson("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pullNumber: task.pull_number }),
    });
    setResult("progress", `Publishing ${task.recipe_name}`, "The status will update here automatically.");
    await loadTasks();
  } catch (error) {
    button.disabled = false;
    setResult("error", "Could not publish recipe", error.message);
  }
}

async function cancelRecipe(task, button) {
  const confirmed = window.confirm(
    `Cancel ${task.recipe_name}? It will not be published.`
  );
  if (!confirmed) {
    return;
  }

  button.disabled = true;
  setResult("busy", `Canceling ${task.recipe_name}`, "Closing this recipe.");
  try {
    await requestJson("/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id, pullNumber: task.pull_number }),
    });
    if (pendingSubmission?.pull_number === task.pull_number) {
      pendingSubmission = null;
    }
    setResult(
      "success",
      `${task.recipe_name} canceled`,
      "It will not be published. Open progress to stop any remaining work.",
      task.detail_url
    );
    await loadTasks();
  } catch (error) {
    button.disabled = false;
    setResult("error", "Could not cancel recipe", error.message);
  }
}

async function submitRecipes(event) {
  event.preventDefault();
  const mode = sourceMode();
  const requestBody = {
    mode,
    notes: notesInput.value,
    pauseForReview: pauseReviewInput.checked,
  };

  if (mode === "link") {
    const urls = recipeUrls();
    if (!urls.length) {
      urlsInput.focus();
      setResult("error", "Add a recipe link", "Paste at least one recipe link above.");
      return;
    }
    if (new Set(urls).size > 5) {
      urlsInput.focus();
      setResult("error", "Too many recipes", "Add up to five recipes at a time.");
      return;
    }
    requestBody.urls = urls;
  } else {
    const recipeText = recipeTextInput.value.trim();
    if (!recipeText) {
      recipeTextInput.focus();
      setResult("error", "Paste a recipe", "Include the recipe name, ingredients, and directions.");
      return;
    }
    requestBody.recipeText = recipeText;
  }

  submitButton.disabled = true;
  const itemCount = mode === "link" ? requestBody.urls.length : 1;
  setResult("busy", itemCount === 1 ? "Reading recipe" : "Reading recipes", "This can take a moment.");
  try {
    const payload = await requestJson("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const names = payload.recipes.map((recipe) => recipe.title);
    const displayName = names.join(" + ");
    pendingSubmission = {
      recipe_name: displayName,
      pull_number: payload.pullNumber,
      detail_url: payload.taskUrl,
      created_at: new Date().toISOString(),
      state: "queued",
    };
    setResult(
      "progress",
      names.length === 1 ? `Adding ${displayName}` : `Adding ${names.length} recipes`,
      "You can follow along under Recent recipes.",
      payload.taskUrl
    );
    form.reset();
    document.querySelector(`input[name="source-mode"][value="${mode}"]`).checked = true;
    updateSourceMode();
    updateUrlCount();
    await loadTasks();
  } catch (error) {
    setResult("error", "Could not add recipe", error.message);
  } finally {
    submitButton.disabled = false;
  }
}

urlsInput.addEventListener("input", updateUrlCount);
sourceModeInputs.forEach((input) => input.addEventListener("change", updateSourceMode));
form.addEventListener("submit", submitRecipes);
refreshButton.addEventListener("click", () => loadTasks());

window.addEventListener("DOMContentLoaded", () => {
  renderIcons();
  updateSourceMode();
  updateUrlCount();
  loadStatus();
  loadTasks();
});