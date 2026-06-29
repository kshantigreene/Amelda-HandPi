const api = {
  async getNodes() {
    const res = await fetch("/api/nodes/");
    return res.json();
  },
  async getEdges() {
    const res = await fetch("/api/edges/");
    return res.json();
  },
  async createNode(id, textContent, previousId) {
    const res = await fetch("/api/nodes/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        text_content: textContent,
        node_type: "free",
        creator: "local",
        previous_id: previousId || null,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async updateNode(id, textContent) {
    const res = await fetch(`/api/nodes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text_content: textContent }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async createEdge(fromId, toId, relationshipType) {
    const res = await fetch("/api/edges/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        from_id: fromId,
        to_id: toId,
        relationship_type: relationshipType,
        creator: "local",
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

// State: notes[] is the ordered history of focused notes, cursor points into
// it, and mode controls what the focused panel renders.
let notes = [];
let cursor = -1;
let mode = "new";

function getOlderNote() {
  if (mode === "new") return cursor >= 0 ? notes[cursor] : null;
  return cursor > 0 ? notes[cursor - 1] : null;
}

function getNewerNote() {
  if (mode === "new") return null;
  return cursor < notes.length - 1 ? notes[cursor + 1] : null;
}

function renderSidePanel(panelId, note, onActivate) {
  const panel = document.getElementById(panelId);
  panel.textContent = note ? note.text : "";
  panel.classList.toggle("inactive", !note);
  panel.onclick = note ? onActivate : null;
}

function buildEditor(initialText, buttons, shortcutAction) {
  const container = document.createElement("div");
  container.className = "nav-focused-inner";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Type here...";
  textarea.value = initialText;

  if (shortcutAction) {
    textarea.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        shortcutAction(textarea.value.trim());
      }
    });
  }

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";
  for (const { label, onClick } of buttons) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = label;
    btn.addEventListener("click", () => onClick(textarea.value.trim()));
    btnRow.appendChild(btn);
  }

  container.append(textarea, btnRow);
  setTimeout(() => textarea.focus(), 0);
  return container;
}

function buildViewer(text, buttons) {
  const container = document.createElement("div");
  container.className = "nav-focused-inner";

  const display = document.createElement("div");
  display.className = "note-display";
  display.textContent = text;

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";
  for (const { label, onClick } of buttons) {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    btnRow.appendChild(btn);
  }

  container.append(display, btnRow);
  return container;
}

function renderFocusedPanel() {
  const panel = document.getElementById("center");
  panel.innerHTML = "";

  if (mode === "new") {
    panel.appendChild(buildEditor("", [{ label: "Submit", onClick: onSubmitNew }], onSubmitNew));
  } else if (mode === "view") {
    panel.appendChild(
      buildViewer(notes[cursor].text, [
        { label: "Edit", onClick: onEditClick },
        { label: "New Note", onClick: onNewClick },
      ])
    );
  } else if (mode === "edit") {
    panel.appendChild(
      buildEditor(notes[cursor].text, [
        { label: "Save", onClick: onSave },
        { label: "Cancel", onClick: onCancel },
      ])
    );
  }
}

function render() {
  renderSidePanel("panel-top-center", getOlderNote(), shiftOlder);
  renderSidePanel("panel-bottom-center", getNewerNote(), shiftNewer);
  renderFocusedPanel();
}

function shiftOlder() {
  if (mode === "new") {
    mode = "view";
  } else if (cursor > 0) {
    cursor -= 1;
    mode = "view";
  }
  render();
}

function shiftNewer() {
  if (mode === "new") return;
  if (cursor < notes.length - 1) {
    cursor += 1;
    mode = "view";
  }
  render();
}

async function resolveNoteId(text, previousId) {
  const existingNodes = await api.getNodes();
  const existing = existingNodes.find((n) => n.text_content === text);
  if (existing) {
    // No createNode call happens on this path, so the backend never gets a
    // chance to create the sequence edge itself -- do it here instead.
    if (previousId) {
      await api.createEdge(previousId, existing.id, "sequence");
    }
    return existing.id;
  }
  const id = crypto.randomUUID();
  await api.createNode(id, text, previousId);
  return id;
}

async function onSubmitNew(text) {
  if (!text) return;
  try {
    const previousId = cursor >= 0 ? notes[cursor].id : null;
    const noteId = await resolveNoteId(text, previousId);
    notes.push({ id: noteId, text });
    cursor = notes.length - 1;
    mode = "view";
    render();
  } catch (err) {
    console.error("Save failed:", err);
  }
}

function onEditClick() {
  mode = "edit";
  render();
}

function onNewClick() {
  mode = "new";
  render();
}

async function onSave(text) {
  if (!text) return;
  try {
    await api.updateNode(notes[cursor].id, text);
    notes[cursor] = { id: notes[cursor].id, text };
    mode = "view";
    render();
  } catch (err) {
    console.error("Save failed:", err);
  }
}

function onCancel() {
  mode = "view";
  render();
}

function applyTheme(isLight) {
  document.body.classList.toggle("light-theme", isLight);
  document.getElementById("theme-toggle").textContent = isLight ? "Dark Mode" : "Light Mode";
}

function onThemeToggle() {
  const isLight = !document.body.classList.contains("light-theme");
  applyTheme(isLight);
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

async function init() {
  document.getElementById("theme-toggle").addEventListener("click", onThemeToggle);
  applyTheme(localStorage.getItem("theme") === "light");
  render();
}

init();