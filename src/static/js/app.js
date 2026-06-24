const api = {
  async getNodes() {
    const res = await fetch("/api/nodes/");
    return res.json();
  },
  async getEdges() {
    const res = await fetch("/api/edges/");
    return res.json();
  },
  async createNode(id, textContent) {
    const res = await fetch("/api/nodes/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, text_content: textContent, node_type: "free", creator: "local" }),
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
  async createEdge(fromId, toId) {
    const res = await fetch("/api/edges/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        from_id: fromId,
        to_id: toId,
        relationship_type: "auto",
        creator: "local",
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

let currentNodeId = null;
let nodeHistory = [];

async function onNewNoteSubmitted(text) {
  const nodes = await api.getNodes();
  const existing = nodes.find((n) => n.text_content === text);

  if (existing) {
    currentNodeId = existing.id;
  } else {
    currentNodeId = crypto.randomUUID();
    await api.createNode(currentNodeId, text);
  }

  if (nodeHistory.length > 0) {
    const lastNodeId = nodeHistory[nodeHistory.length - 1];
    await api.createEdge(lastNodeId, currentNodeId);
  }
}

async function onSubmit() {
  const text = document.getElementById("input").value.trim();
  if (!text) return;

  try {
    if (currentNodeId === null) {
      await onNewNoteSubmitted(text);
    } else {
      await api.updateNode(currentNodeId, text);
    }
  } catch (err) {
    console.error("Save failed:", err);
    return;
  }

  //change color to show submitted but not editable
  const lockedInput = document.getElementById("input");
  lockedInput.style.background = "#737598";
  lockedInput.style.color = "#ffffff";
  lockedInput.disabled = true;
  //change the submit button to edit
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.textContent = "Edit";
  submitBtn.removeEventListener("click", onSubmit);
  submitBtn.addEventListener("click", onEdit);

  const newBtn = document.getElementById("new-btn");
  newBtn.style.display = "inline";
  newBtn.addEventListener("click", onNew);
}

async function onEdit() {
  //clear inline overrides so the theme's panel background/text show through
  const input = document.getElementById("input");
  input.style.background = "";
  input.style.color = "";
  input.disabled = false;
  input.focus();
  //change the edit button back to submit
  const submitBtn = document.getElementById("submit-btn");
  submitBtn.textContent = "Submit";
  submitBtn.removeEventListener("click", onEdit);
  submitBtn.addEventListener("click", onSubmit);

  const newBtn = document.getElementById("new-btn");
  newBtn.removeEventListener("click", onNew);
  newBtn.style.display = "none";
}

async function onNew() {
  //clear the edit area and make way for a new node
  const input = document.getElementById("input");
  nodeHistory.push(currentNodeId);
  document.getElementById("panel-top-center").textContent = input.value;
  currentNodeId = null;
  input.value = "";
  onEdit();
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
  document.getElementById("submit-btn").addEventListener("click", onSubmit);
  document.getElementById("theme-toggle").addEventListener("click", onThemeToggle);
  applyTheme(localStorage.getItem("theme") === "light");
}

init();
