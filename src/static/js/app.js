// Copyright (c) 2026 Kshanti Greene. All rights reserved.

// -- IndexedDB persistence --------------------------------------------------
const IDB_NAME = "amelda";
const IDB_VERSION = 1;
let _idb = null;

function openIDB() {
  if (_idb) return Promise.resolve(_idb);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = ({ target: { result: db } }) => {
      if (!db.objectStoreNames.contains("nodes"))
        db.createObjectStore("nodes", { keyPath: "id" });
      if (!db.objectStoreNames.contains("edges"))
        db.createObjectStore("edges", { keyPath: "id" });
    };
    req.onsuccess = ({ target: { result: db } }) => { _idb = db; resolve(db); };
    req.onerror = ({ target: { error } }) => reject(error);
  });
}

async function idbGetAll(store) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(store, id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store, obj) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).put(obj);
    req.onsuccess = () => resolve(obj);
    req.onerror = () => reject(req.error);
  });
}

// -- Word-match (ported from word_match.py) ---------------------------------
const STOP_WORDS = new Set(["able","about","above","abroad","according","accordingly","across","actually","adj","after","afterwards","again","against","ago","ahead","all","allow","allows","almost","alone","along","alongside","already","also","although","always","am","amid","amidst","among","amongst","an","and","another","any","anybody","anyhow","anyone","anything","anyway","anyways","anywhere","apart","appear","appreciate","appropriate","are","around","as","aside","ask","asking","associated","at","available","away","awfully","back","backward","backwards","be","became","because","become","becomes","becoming","been","before","beforehand","begin","behind","being","believe","below","beside","besides","best","better","between","beyond","both","brief","but","by","came","can","cannot","cant","caption","cause","causes","certain","certainly","changes","clearly","co","come","comes","concerning","consequently","consider","considering","contain","containing","contains","corresponding","could","course","currently","dare","definitely","described","despite","did","different","directly","do","does","doing","done","down","downwards","during","each","edu","eg","eight","eighty","either","else","elsewhere","end","ending","enough","entirely","especially","et","etc","even","ever","evermore","every","everybody","everyone","everything","everywhere","ex","exactly","example","except","fairly","far","farther","few","fewer","fifth","first","five","followed","following","follows","for","forever","former","formerly","forth","forward","found","four","from","further","furthermore","get","gets","getting","given","gives","go","goes","going","gone","got","gotten","greetings","had","half","happens","hardly","has","have","having","he","hello","help","hence","her","here","hereafter","hereby","herein","hereupon","hers","herself","hi","him","himself","his","hither","hopefully","how","howbeit","however","hundred","ie","if","ignored","immediate","in","inasmuch","inc","indeed","indicate","indicated","indicates","inner","inside","insofar","instead","into","inward","is","it","its","itself","just","keep","keeps","kept","know","known","knows","last","lately","later","latter","latterly","least","less","lest","let","like","liked","likely","likewise","little","look","looking","looks","low","lower","ltd","made","mainly","make","makes","many","may","maybe","me","mean","meantime","meanwhile","merely","might","mine","minus","miss","more","moreover","most","mostly","mr","mrs","much","must","my","myself","name","namely","nd","near","nearly","necessary","need","needs","neither","never","neverf","neverless","nevertheless","new","next","nine","ninety","no","nobody","non","none","nonetheless","noone","nor","normally","not","nothing","notwithstanding","novel","now","nowhere","obviously","of","off","often","oh","ok","okay","old","on","once","one","ones","only","onto","opposite","or","other","others","otherwise","ought","our","ours","ourselves","out","outside","over","overall","own","particular","particularly","past","per","perhaps","placed","please","plus","possible","presumably","probably","provided","provides","que","quite","qv","rather","rd","re","really","reasonably","recent","recently","regarding","regardless","regards","relatively","respectively","right","round","said","same","saw","say","saying","says","second","secondly","see","seeing","seem","seemed","seeming","seems","seen","self","selves","sensible","sent","serious","seriously","seven","several","shall","she","should","since","six","so","some","somebody","someday","somehow","someone","something","sometime","sometimes","somewhat","somewhere","soon","sorry","specified","specify","specifying","still","sub","such","sup","sure","take","taken","taking","tell","tends","th","than","thank","thanks","thanx","that","the","their","theirs","them","themselves","then","thence","there","thereafter","thereby","therefore","therein","theres","thereupon","these","they","thing","things","think","third","thirty","this","thorough","thoroughly","those","though","three","through","throughout","thru","thus","till","to","together","too","took","toward","towards","tried","tries","truly","try","trying","twice","two","un","under","underneath","undoing","unfortunately","unless","unlike","unlikely","until","unto","up","upon","upwards","us","use","used","useful","uses","using","usually","value","various","versus","very","via","viz","vs","want","wants","was","way","we","welcome","well","went","were","what","whatever","when","whence","whenever","where","whereafter","whereas","whereby","wherein","whereupon","wherever","whether","which","whichever","while","whilst","whither","who","whoever","whole","whom","whomever","whose","why","will","willing","wish","with","within","without","wonder","would","yes","yet","you","your","yours","yourself","yourselves","zero","a","i","b","c","d","e","f","g","h","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","www","amount","bill","bottom","call","computer","con","cry","de","describe","detail","due","eleven","empty","fifteen","fifty","fill","find","fire","forty","front","full","give","interest","mill","move","part","put","show","side","sincere","sixty","system","ten","thick","thin","top","twelve","twenty","abst","accordance","act","added","adopted","affected","affecting","affects","ah","announce","anymore","apparently","approximately","arise","auth","beginning","beginnings","begins","biol","briefly","ca","date","ed","effect","ff","fix","gave","giving","hid","home","id","im","immediately","importance","important","index","information","invention","keys","kg","km","largely","lets","line","means","mg","million","ml","mug","na","nay","necessarily","nos","noted","obtain","obtained","omitted","ord","owing","page","pages","poorly","possibly","potentially","pp","predominantly","present","previously","primarily","promptly","proud","quickly","ran","readily","ref","refs","related","research","resulted","resulting","results","run","sec","section","showed","shown","shows","significant","significantly","similar","similarly","slightly","somethan","specifically","state","states","stop","strongly","substantially","successfully","sufficiently","suggest","thereof","thereto","thou","thousand","til","tip","ts","ups","usefully","usefulness","vol","vols","wed","widely","words","world"]);

function extractWords(text) {
  if (!text) return new Set();
  const raw = text.toLowerCase().match(/[a-z']+/g) || [];
  return new Set(raw.filter(w => !STOP_WORDS.has(w)));
}

// -- BFS connected-subgraph export (mirrors export.py _subgraph) ------------
function exportConnected(focusedId, allNodes, allEdges) {
  const EXPORT_TYPES = new Set(["sequence", "user"]);
  const nodesById = new Map(allNodes.map(n => [n.id, n]));
  const visited = new Set();
  const queue = [focusedId];
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    for (const e of allEdges) {
      if (!EXPORT_TYPES.has(e.relationship_type)) continue;
      if (e.from_id === cur && !visited.has(e.to_id)) queue.push(e.to_id);
      else if (e.to_id === cur && !visited.has(e.from_id)) queue.push(e.from_id);
    }
  }
  return {
    nodes: [...visited].filter(id => nodesById.has(id)).map(id => nodesById.get(id)),
    edges: allEdges.filter(e => EXPORT_TYPES.has(e.relationship_type) && visited.has(e.from_id) && visited.has(e.to_id)),
  };
}

// null = IndexedDB mode; object = external JSON graph is open (never touches IndexedDB)
let fileGraph = null;
let fileGraphDirty = false;
let _preFileState = null; // saves app state to restore when file is closed

const api = {
  async getNodes() {
    if (fileGraph) return fileGraph.nodes.filter(n => !n.is_deleted);
    return idbGetAll("nodes").then(ns => ns.filter(n => !n.is_deleted));
  },
  async getEdges() {
    if (fileGraph) return fileGraph.edges.filter(e => !e.is_deleted);
    return idbGetAll("edges").then(es => es.filter(e => !e.is_deleted));
  },
  async createNode(id, textContent, previousId) {
    if (fileGraph) {
      const now = new Date().toISOString();
      const node = { id, text_content: textContent, other_content: null, node_type: "free", creator: "local", created_at: now, updated_at: now, is_deleted: 0 };
      fileGraph.nodes.push(node);
      if (previousId) {
        fileGraph.edges.push({ id: crypto.randomUUID(), from_id: previousId, to_id: id, directed: 1, relationship_type: "sequence", weight: null, creator: "local", created_at: now, updated_at: now, is_deleted: 0 });
      }
      fileGraphDirty = true;
      return node;
    }
    const now = new Date().toISOString();
    const node = { id, text_content: textContent, other_content: null, node_type: "free", creator: "local", created_at: now, updated_at: now, is_deleted: 0 };
    await idbPut("nodes", node);
    if (previousId) {
      const edge = { id: crypto.randomUUID(), from_id: previousId, to_id: id, directed: 1, relationship_type: "sequence", weight: null, creator: "local", created_at: now, updated_at: now, is_deleted: 0 };
      await idbPut("edges", edge);
    }
    return node;
  },
  async updateNode(id, textContent) {
    if (fileGraph) {
      const node = fileGraph.nodes.find(n => n.id === id && !n.is_deleted);
      if (!node) throw new Error("Node not found");
      node.text_content = textContent;
      node.updated_at = new Date().toISOString();
      fileGraphDirty = true;
      return node;
    }
    const node = await idbGet("nodes", id);
    if (!node || node.is_deleted) throw new Error("Node not found");
    node.text_content = textContent;
    node.updated_at = new Date().toISOString();
    return idbPut("nodes", node);
  },
  async createEdge(fromId, toId, relationshipType) {
    if (fileGraph) {
      const now = new Date().toISOString();
      const weight = relationshipType === "user" ? 1.0 : relationshipType === "auto" ? 0.1 : null;
      const edge = { id: crypto.randomUUID(), from_id: fromId, to_id: toId, directed: 1, relationship_type: relationshipType, weight, creator: "local", created_at: now, updated_at: now, is_deleted: 0 };
      fileGraph.edges.push(edge);
      fileGraphDirty = true;
      return edge;
    }
    const now = new Date().toISOString();
    const weight = relationshipType === "user" ? 1.0 : relationshipType === "auto" ? 0.1 : null;
    const edge = { id: crypto.randomUUID(), from_id: fromId, to_id: toId, directed: 1, relationship_type: relationshipType, weight, creator: "local", created_at: now, updated_at: now, is_deleted: 0 };
    return idbPut("edges", edge);
  },
  async deleteEdge(edgeId) {
    if (fileGraph) {
      const edge = fileGraph.edges.find(e => e.id === edgeId && !e.is_deleted);
      if (!edge) throw new Error("Edge not found");
      edge.is_deleted = 1;
      fileGraphDirty = true;
      return;
    }
    const edge = await idbGet("edges", edgeId);
    if (!edge) throw new Error("Edge not found");
    edge.is_deleted = 1;
    await idbPut("edges", edge);
  },
  async deleteNode(nodeId) {
    if (fileGraph) {
      const node = fileGraph.nodes.find(n => n.id === nodeId && !n.is_deleted);
      if (!node) throw new Error("Node not found");
      node.is_deleted = 1;
      fileGraph.edges.forEach(e => {
        if ((e.from_id === nodeId || e.to_id === nodeId) && !e.is_deleted) e.is_deleted = 1;
      });
      fileGraphDirty = true;
      return;
    }
    const node = await idbGet("nodes", nodeId);
    if (!node) throw new Error("Node not found");
    node.is_deleted = 1;
    await idbPut("nodes", node);
    const allEdges = await idbGetAll("edges");
    for (const edge of allEdges) {
      if ((edge.from_id === nodeId || edge.to_id === nodeId) && !edge.is_deleted) {
        edge.is_deleted = 1;
        await idbPut("edges", edge);
      }
    }
  },
  async matchEdges(nodeId) {
    if (fileGraph) return { created_edges: [] }; // auto edges skipped for external graphs
    const [allNodes, allEdges] = await Promise.all([
      idbGetAll("nodes").then(ns => ns.filter(n => !n.is_deleted)),
      idbGetAll("edges").then(es => es.filter(e => !e.is_deleted)),
    ]);
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return { created_edges: [] };

    const alreadyLinked = new Set(
      allEdges
        .filter(e => e.from_id === nodeId || e.to_id === nodeId)
        .map(e => e.from_id === nodeId ? e.to_id : e.from_id)
    );
    const nodeWords = extractWords(node.text_content);
    if (!nodeWords.size) return { created_edges: [] };

    const now = new Date().toISOString();
    const created = [];
    for (const other of allNodes) {
      if (other.id === nodeId || alreadyLinked.has(other.id)) continue;
      const common = [...nodeWords].filter(w => extractWords(other.text_content).has(w));
      if (!common.length) continue;
      const weight = Math.log(common.length + 1);
      const [fromId, toId] = (node.created_at || "") <= (other.created_at || "")
        ? [node.id, other.id] : [other.id, node.id];
      const edge = { id: crypto.randomUUID(), from_id: fromId, to_id: toId, directed: 1, relationship_type: "auto", weight, creator: "system", created_at: now, updated_at: now, is_deleted: 0 };
      await idbPut("edges", edge);
      created.push(edge.id);
      alreadyLinked.add(other.id);
    }
    return { created_edges: created };
  },
  async getNode(id) {
    if (fileGraph) return fileGraph.nodes.find(n => n.id === id && !n.is_deleted) || null;
    const node = await idbGet("nodes", id);
    return node && !node.is_deleted ? node : null;
  },
  async getState() {
    if (fileGraph) return { current_note_id: null, mode: "new" };
    try {
      const saved = localStorage.getItem("amelda_state");
      return saved ? JSON.parse(saved) : { current_note_id: null, mode: "new" };
    } catch { return { current_note_id: null, mode: "new" }; }
  },
  async setState(currentNoteId, modeValue) {
    if (fileGraph) return; // state is in-memory only during file mode
    localStorage.setItem("amelda_state", JSON.stringify({ current_note_id: currentNoteId, mode: modeValue }));
  },
};

// State: currentNote is the focused note ({id, text} or null), mode controls
// what the focused panel renders. Older/newer (top/bottom) and related
// (left/right) panels are derived live from the graph's edges, not from any
// local history -- top/bottom follow "sequence" edges (temporal), left/right
// follow "auto"/"user" edges (semantic).
let currentNote = null;
let mode = "new";
let connectSearch = "";
let _rightPanelFocusedId = null; // tracks which note the right panel's shell was built for
let _graphPanelVersion = 0;      // incremented on each renderGraphPanels call; stale fetches self-discard

const VERTICAL_EDGE_TYPE = "sequence";
const MAX_RELATED = 5;

function renderSidePanel(panelId, note, onActivate, posLabel, jumpNode, jumpGlyph, hintText) {
  const panel = document.getElementById(panelId);
  panel.innerHTML = "";
  panel.classList.toggle("inactive", !note);
  panel.onclick = note ? onActivate : null;
  if (!note && hintText) {
    const hint = document.createElement("div");
    hint.className = "panel-empty-hint";
    hint.textContent = hintText;
    panel.appendChild(hint);
  }
  if (note) {
    if (posLabel || jumpNode) {
      const row = document.createElement("div");
      row.className = "seq-label-row";

      const makeGlyph = (ch, node) => {
        const g = document.createElement("span");
        g.className = "seq-jump-glyph";
        g.textContent = ch;
        g.addEventListener("click", (e) => { e.stopPropagation(); focusOnNode(node); });
        return g;
      };

      if (jumpGlyph === "\u00AB" && jumpNode) row.appendChild(makeGlyph("\u00AB", jumpNode));
      if (posLabel) {
        const lbl = document.createElement("span");
        lbl.className = "seq-position-label";
        lbl.textContent = posLabel;
        row.appendChild(lbl);
      }
      if (jumpGlyph === "\u00BB" && jumpNode) row.appendChild(makeGlyph("\u00BB", jumpNode));

      panel.appendChild(row);
    }
    panel.appendChild(document.createTextNode(note.text));
  }
}

// Returns the ordered array of node IDs in the sequence chain containing nodeId.
function buildChain(seqEdges, nodeId) {
  const byFrom = {};
  const byTo   = {};
  for (const e of seqEdges) {
    (byFrom[e.from_id] = byFrom[e.from_id] || []).push(e);
    (byTo[e.to_id]     = byTo[e.to_id]     || []).push(e);
  }
  const next = (id) => { const es = byFrom[id]; return es ? mostRecent(es).to_id   : null; };
  const prev = (id) => { const es = byTo[id];   return es ? mostRecent(es).from_id : null; };

  let head = nodeId;
  const visited = new Set();
  while (prev(head) && !visited.has(head)) { visited.add(head); head = prev(head); }

  const chain = [];
  const seen = new Set();
  for (let cur = head; cur && !seen.has(cur); cur = next(cur)) {
    chain.push(cur);
    seen.add(cur);
  }
  return chain;
}

function getChainInfo(seqEdges, nodeId) {
  const chain = buildChain(seqEdges, nodeId);
  const pos = chain.indexOf(nodeId) + 1;
  return { position: pos > 0 ? pos : null, total: chain.length };
}

function buildEditor(initialText, buttons, shortcutAction) {
  const container = document.createElement("div");
  container.className = "nav-focused-inner";

  const textareaWrap = document.createElement("div");
  textareaWrap.className = "textarea-wrap";

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Type here...";
  textarea.value = initialText;

  const autoResize = () => {
    textarea.style.height = "0";
    textarea.style.height = Math.max(textarea.scrollHeight, textareaWrap.clientHeight) + "px";
  };
  textarea.addEventListener("input", autoResize);

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

  for (const item of buttons) {
    if (item.spacer) {
      const s = document.createElement("div");
      s.style.flex = "1";
      btnRow.appendChild(s);
      continue;
    }
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = item.label;
    btn.addEventListener("click", () => item.onClick(textarea.value.trim()));
    btnRow.appendChild(btn);
  }

  textareaWrap.appendChild(textarea);
  container.append(textareaWrap, btnRow);
  setTimeout(() => { autoResize(); textarea.focus(); }, 0);
  return container;
}

function buildViewer(text, buttons) {
  const container = document.createElement("div");
  container.className = "nav-focused-inner";

  const chainLabel = document.createElement("div");
  chainLabel.className = "seq-position-label focused-chain-label";

  const display = document.createElement("div");
  display.className = "note-display";
  display.textContent = text;

  const btnRow = document.createElement("div");
  btnRow.className = "btn-row";
  for (const item of buttons) {
    if (item.spacer) {
      const s = document.createElement("div");
      s.style.flex = "1";
      btnRow.appendChild(s);
      continue;
    }
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = item.label;
    btn.addEventListener("click", item.onClick);
    btnRow.appendChild(btn);
  }

  container.append(chainLabel, display, btnRow);
  return container;
}

function buildFocusSearch() {
  const wrapper = document.createElement("div");
  wrapper.className = "focus-search-wrap";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "focus-search-input";
  input.placeholder = "Find note\u2026";

  const dropdown = document.createElement("div");
  dropdown.className = "focus-search-dropdown";
  dropdown.hidden = true;

  input.addEventListener("input", async () => {
    const q = input.value.trim().toLowerCase();
    dropdown.innerHTML = "";
    if (!q) { dropdown.hidden = true; return; }
    const nodes = await api.getNodes();
    const matches = nodes
      .filter((n) => n.id !== currentNote?.id && (n.text_content || "").toLowerCase().includes(q))
      .slice(0, 8);
    if (!matches.length) { dropdown.hidden = true; return; }
    for (const node of matches) {
      const item = document.createElement("div");
      item.className = "focus-search-item";
      item.textContent = node.text_content;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault(); // keep dropdown alive until click fires
        focusOnNode(node);
      });
      dropdown.appendChild(item);
    }
    dropdown.hidden = false;
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { dropdown.hidden = true; input.value = ""; }, 150);
  });

  wrapper.append(input, dropdown);
  return wrapper;
}

function renderFocusedPanel() {
  const panel = document.getElementById("center");
  panel.innerHTML = "";

  let el;
  if (mode === "new") {
    el = buildEditor("", [
      { spacer: true },
      { label: "Submit", onClick: onSubmitNew },
      { label: "New Note", onClick: (draft) => {
        if (draft && !confirm("Abandon this note?")) return;
        onNewClick();
      }},
    ], onSubmitNew);
  } else if (mode === "view") {
    el = buildViewer(currentNote.text, [
      { spacer: true },
      { label: "Edit", onClick: onEditClick },
      { label: "Delete", onClick: onDeleteClick },
      { label: "New Note", onClick: onNewClick },
    ]);
  } else if (mode === "edit") {
    el = buildEditor(currentNote.text, [
      { spacer: true },
      { label: "Submit", onClick: onSave },
      { label: "Delete", onClick: onDeleteClick },
      { label: "New Note", onClick: (draft) => {
        if (draft !== (currentNote?.text || "") && !confirm("Abandon this note?")) return;
        onNewClick();
      }},
    ]);
  }

  el.querySelector(".btn-row").prepend(buildFocusSearch());
  panel.appendChild(el);
}

function makeBlockActionBtn(label, tooltip, onClick) {
  const btn = document.createElement("button");
  btn.className = "block-action";
  btn.textContent = label;
  btn.title = tooltip;
  btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(); });
  return btn;
}

function renderRelatedBlocks(panelId, items, focusedId, headerLabel) {
  const panel = document.getElementById(panelId);
  panel.innerHTML = "";
  if (headerLabel) {
    const header = document.createElement("div");
    header.className = "panel-section-header";
    header.textContent = headerLabel;
    panel.appendChild(header);
  }
  for (const { node, weight } of items) {
    const block = document.createElement("div");
    block.className = "related-block";

    const text = document.createElement("div");
    text.className = "related-text";
    text.textContent = node.text_content;

    const weightLabel = document.createElement("div");
    weightLabel.className = "related-weight";
    weightLabel.textContent = `w=${weight.toFixed(2)}`;

    block.append(text, weightLabel);

    if (focusedId) {
      block.appendChild(makeBlockActionBtn("+", "promote connection", async () => {
        await api.createEdge(focusedId, node.id, "user");
        renderGraphPanels();
      }));
    }

    block.addEventListener("click", () => focusOnNode(node));
    panel.appendChild(block);
  }
}

// Single point of mutation for currentNote/mode -- renders immediately, then
// persists to the DB so a page refresh restores exactly this state.
function setAppState(note, newMode) {
  if (note?.id !== currentNote?.id) {
    connectSearch = "";
    _rightPanelFocusedId = null;
  }
  currentNote = note;
  mode = newMode;
  render();
  api.setState(note ? note.id : null, newMode).catch((err) => console.error("Failed to persist state:", err));
}

function focusOnNode(node) {
  if (!node) return;
  const text = node.text_content !== undefined ? node.text_content : node.text;
  setAppState({ id: node.id, text }, "view");
}

// Picks a single neighbor when more than one sequence edge exists in the same
// direction (e.g. branching history) -- most recently created wins.
function mostRecent(edges) {
  return edges.slice().sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))[0];
}

async function renderGraphPanels() {
  const version = ++_graphPanelVersion;
  const leftPanel = document.getElementById("panel-left");
  const rightPanel = document.getElementById("panel-right");

  if (!currentNote) {
    renderSidePanel("panel-top-center", null, null);
    renderSidePanel("panel-bottom-center", null, null);
    leftPanel.innerHTML = "";
    rightPanel.innerHTML = "";
    _rightPanelFocusedId = null;
    return;
  }

  const focusedId = currentNote.id;
  const [allNodes, allEdges] = await Promise.all([api.getNodes(), api.getEdges()]);
  if (version !== _graphPanelVersion) return; // a newer call is in flight; discard this result
  const nodesById = new Map(allNodes.map((n) => [n.id, n]));

  const sequenceEdges = allEdges.filter((e) => e.relationship_type === VERTICAL_EDGE_TYPE);
  const chain = buildChain(sequenceEdges, focusedId);
  const total = chain.length;
  const fmtPos = (id) => { const p = chain.indexOf(id) + 1; return p > 0 && total > 1 ? `${p}/${total}` : null; };
  const firstNode = nodesById.get(chain[0]);
  const lastNode  = nodesById.get(chain[chain.length - 1]);

  if (mode === "new") {
    // Show the note being continued from with its chain position
    const currentPos = chain.indexOf(focusedId) + 1;
    renderSidePanel("panel-top-center",
      { text: currentNote.text },
      () => focusOnNode(currentNote),
      total > 1 ? `${currentPos}/${total}` : null,
      currentPos > 1 ? firstNode : null, "\u00AB");
    renderSidePanel("panel-bottom-center", null, null, null, null, null, "Later in sequence");
    leftPanel.innerHTML = "";
    rightPanel.innerHTML = "";
    _rightPanelFocusedId = null;
    return;
  }

  const olderEdge = mostRecent(sequenceEdges.filter((e) => e.to_id === focusedId));
  const newerEdge = mostRecent(sequenceEdges.filter((e) => e.from_id === focusedId));
  const olderNode = olderEdge ? nodesById.get(olderEdge.from_id) : null;
  const newerNode = newerEdge ? nodesById.get(newerEdge.to_id) : null;

  const focusedChainEl = document.querySelector(".focused-chain-label");
  if (focusedChainEl) {
    const fp = chain.indexOf(focusedId) + 1;
    focusedChainEl.textContent = fp > 0 && total > 1 ? `${fp}/${total}` : "";
  }

  // Suppress \u00AB when olderNode is already first; suppress \u00BB when newerNode is already last
  const olderIsFirst = olderNode && olderNode.id === chain[0];
  const newerIsLast  = newerNode && newerNode.id === chain[chain.length - 1];

  renderSidePanel("panel-top-center",
    olderNode ? { text: olderNode.text_content } : null,
    () => focusOnNode(olderNode),
    olderNode ? fmtPos(olderNode.id) : null,
    olderIsFirst ? null : firstNode, "\u00AB",
    "Earlier in sequence");
  renderSidePanel("panel-bottom-center",
    newerNode ? { text: newerNode.text_content } : null,
    () => focusOnNode(newerNode),
    newerNode ? fmtPos(newerNode.id) : null,
    newerIsLast ? null : lastNode, "\u00BB",
    "Later in sequence");

  // For left/right panels, direction doesn't matter -- only edge type does.
  // Resolve the "other" node for any edge involving the focused node.
  const toRankedByType = (type) =>
    allEdges
      .filter((e) => e.relationship_type === type && (e.from_id === focusedId || e.to_id === focusedId))
      .map((e) => ({
        node: nodesById.get(e.from_id === focusedId ? e.to_id : e.from_id),
        weight: e.weight ?? 0,
      }))
      .filter((x) => x.node)
      .sort((a, b) => b.weight - a.weight || (b.node.created_at || "").localeCompare(a.node.created_at || ""))
      .slice(0, MAX_RELATED);

  renderRelatedBlocks("panel-left", toRankedByType("auto"), focusedId, "Suggested Connections");
  renderRightPanel(allNodes, allEdges, nodesById, focusedId);
}

function _updateRightContent(contentEl, allNodes, allEdges, nodesById, focusedId) {
  const rightPanel = document.getElementById("panel-right");
  const cancelBtn = rightPanel._cancelBtn; // survives contentEl.innerHTML resets
  const isSearching = !!connectSearch;

  rightPanel.classList.toggle("connect-mode", isSearching);
  if (!isSearching) {
    const input = rightPanel.querySelector(".connect-input");
    if (input) input.value = "";
  }

  contentEl.innerHTML = ""; // detaches cancelBtn if it was in contentEl

  if (isSearching) {
    const query = connectSearch.toLowerCase();
    const alreadyLinked = new Set(
      allEdges
        .filter((e) => e.relationship_type === "user" && (e.from_id === focusedId || e.to_id === focusedId))
        .map((e) => (e.from_id === focusedId ? e.to_id : e.from_id))
    );
    allNodes
      .filter((n) => n.id !== focusedId && !alreadyLinked.has(n.id) && (n.text_content || "").toLowerCase().includes(query))
      .forEach((node) => {
        const block = document.createElement("div");
        block.className = "related-block";
        const text = document.createElement("div");
        text.className = "related-text";
        text.textContent = node.text_content;
        block.appendChild(text);
        block.addEventListener("click", async () => {
          await api.createEdge(focusedId, node.id, "user");
          connectSearch = "";
          renderGraphPanels();
        });
        contentEl.appendChild(block);
      });

    // "Create & connect" option â€” always shown when there's a query
    const createBlock = document.createElement("div");
    createBlock.className = "related-block create-note-block";
    const createText = document.createElement("div");
    createText.className = "related-text";
    createText.textContent = `+ Create: "${connectSearch}"`;
    createBlock.appendChild(createText);
    createBlock.addEventListener("click", async () => {
      const text = connectSearch;
      const existing = allNodes.find((n) => n.text_content === text);
      let nodeId;
      if (existing) {
        nodeId = existing.id;
      } else {
        nodeId = crypto.randomUUID();
        await api.createNode(nodeId, text, null);
        await api.matchEdges(nodeId);
      }
      const alreadyUserLinked = allEdges.some(
        (e) => e.relationship_type === "user" &&
          ((e.from_id === focusedId && e.to_id === nodeId) ||
           (e.to_id === focusedId && e.from_id === nodeId))
      );
      if (!alreadyUserLinked) {
        await api.createEdge(focusedId, nodeId, "user");
      }
      connectSearch = "";
      renderGraphPanels();
    });
    contentEl.appendChild(createBlock);
    if (cancelBtn) { cancelBtn.style.display = ""; contentEl.appendChild(cancelBtn); }
  } else {
    if (cancelBtn) { cancelBtn.style.display = "none"; rightPanel.appendChild(cancelBtn); }
    allEdges
      .filter((e) => e.relationship_type === "user" && (e.from_id === focusedId || e.to_id === focusedId))
      .map((e) => ({
        node: nodesById.get(e.from_id === focusedId ? e.to_id : e.from_id),
        weight: e.weight ?? 0,
        edgeCreatedAt: e.created_at || "",
        edgeId: e.id,
      }))
      .filter((x) => x.node)
      .sort((a, b) => b.weight - a.weight || b.edgeCreatedAt.localeCompare(a.edgeCreatedAt))
      .slice(0, MAX_RELATED)
      .forEach(({ node, weight, edgeId }) => {
        const block = document.createElement("div");
        block.className = "related-block";
        const text = document.createElement("div");
        text.className = "related-text";
        text.textContent = node.text_content;
        const wl = document.createElement("div");
        wl.className = "related-weight";
        wl.textContent = `w=${weight.toFixed(2)}`;
        block.append(text, wl);
        block.appendChild(makeBlockActionBtn("-", "remove connection", async () => {
          await api.deleteEdge(edgeId);
          renderGraphPanels();
        }));
        block.addEventListener("click", () => focusOnNode(node));
        contentEl.appendChild(block);
      });
  }
}

function renderRightPanel(allNodes, allEdges, nodesById, focusedId) {
  const panel = document.getElementById("panel-right");

  if (focusedId !== _rightPanelFocusedId) {
    // Focused note changed: rebuild the shell (search bar + content wrapper)
    _rightPanelFocusedId = focusedId;
    panel.innerHTML = "";

    const header = document.createElement("div");
    header.className = "panel-section-header";
    header.textContent = "Connections";
    header.style.padding = "8px 8px 4px";

    const searchBar = document.createElement("div");
    searchBar.className = "connect-search-bar";

    const input = document.createElement("textarea");
    input.className = "connect-input";
    input.placeholder = "Search to connect...";
    input.value = connectSearch;
    input.rows = 1;

    const connectAutoResize = () => {
      if (!input.value) { input.style.height = ""; return; }
      input.style.height = "auto";
      input.style.height = input.scrollHeight + "px";
    };

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "connect-cancel btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.display = "none";

    const contentEl = document.createElement("div");
    contentEl.className = "right-panel-content";

    input.addEventListener("input", (e) => {
      connectSearch = e.target.value;
      connectAutoResize();
      _updateRightContent(contentEl, allNodes, allEdges, nodesById, focusedId);
    });

    cancelBtn.addEventListener("click", () => {
      connectSearch = "";
      input.value = "";
      connectAutoResize();
      _updateRightContent(contentEl, allNodes, allEdges, nodesById, focusedId);
    });

    searchBar.append(input);
    panel.append(header, searchBar, contentEl);
    panel._cancelBtn = cancelBtn; // stored off-DOM; _updateRightContent moves it as needed
  }

  const contentEl = panel.querySelector(".right-panel-content");
  _updateRightContent(contentEl, allNodes, allEdges, nodesById, focusedId);
}

function render() {
  renderFocusedPanel();
  renderGraphPanels();
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
    return { id: existing.id, isNew: false };
  }
  const id = crypto.randomUUID();
  await api.createNode(id, text, previousId);
  return { id, isNew: true };
}

async function onSubmitNew(text) {
  if (!text) return;
  try {
    const previousId = currentNote ? currentNote.id : null;

    // Before creating the new note, check if previousId already has a
    // sequence successor so we can insert between them rather than branch.
    let newerEdge = null;
    if (previousId) {
      const allEdges = await api.getEdges();
      const seqForward = allEdges.filter(
        (e) => e.relationship_type === "sequence" && e.from_id === previousId
      );
      newerEdge = mostRecent(seqForward) || null;
    }

    const { id: noteId, isNew } = await resolveNoteId(text, previousId);

    // Insert into the chain: new â†’ newerNode, old direct edge removed.
    // Guard against the degenerate case where the resolved note IS the next node.
    if (newerEdge && newerEdge.to_id !== noteId) {
      await api.createEdge(noteId, newerEdge.to_id, "sequence");
      await api.deleteEdge(newerEdge.id);
    }

    setAppState({ id: noteId, text }, "view");

    if (isNew) {
      // Word-match edges are computed server-side; wait for that specific
      // call to finish, then refresh so they actually show up.
      await api.matchEdges(noteId);
      renderGraphPanels();
    }
  } catch (err) {
    console.error("Save failed:", err);
  }
}

function onEditClick() {
  setAppState(currentNote, "edit");
}

function onNewClick() {
  // Second click while already drafting breaks the sequential chain --
  // the new note will have no previous_id and won't connect to anything.
  setAppState(mode === "new" ? null : currentNote, "new");
}

async function onSave(text) {
  if (!text) return;
  if (text === currentNote.text) {
    setAppState(currentNote, "view");
    return;
  }
  try {
    await api.updateNode(currentNote.id, text);
    setAppState({ id: currentNote.id, text }, "view");
  } catch (err) {
    console.error("Save failed:", err);
  }
}

async function onDeleteClick() {
  if (!currentNote) return;
  const preview = currentNote.text.length > 60
    ? currentNote.text.slice(0, 60) + "\u2026"
    : currentNote.text;
  if (!confirm(`Delete this note?\n\n"${preview}"\n\nThis cannot be undone.`)) return;

  try {
    const nodeId = currentNote.id;
    const allEdges = await api.getEdges();

    const seqEdges = allEdges.filter((e) => e.relationship_type === "sequence");
    const beforeEdge = mostRecent(seqEdges.filter((e) => e.to_id === nodeId));
    const afterEdge  = mostRecent(seqEdges.filter((e) => e.from_id === nodeId));

    // Stitch the chain back together before deleting this node's edges
    if (beforeEdge && afterEdge) {
      await api.createEdge(beforeEdge.from_id, afterEdge.to_id, "sequence");
    }

    await api.deleteNode(nodeId);

    // Navigate to the nearest surviving neighbor, preferring older
    const fallbackId = beforeEdge?.from_id || afterEdge?.to_id || null;
    if (fallbackId) {
      const node = await api.getNode(fallbackId);
      if (node) { focusOnNode(node); return; }
    }
    setAppState(null, "new");
  } catch (err) {
    console.error("Delete failed:", err);
  }
}

function onCancel() {
  setAppState(currentNote, "view");
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

function updateFileModeUI() {
  document.getElementById("save-graph").style.display = fileGraph ? "" : "none";
  document.getElementById("close-graph").style.display = fileGraph ? "" : "none";
  const panel = document.getElementById("panel-top-left");
  panel.innerHTML = "";
  if (fileGraph) {
    const el = document.createElement("div");
    el.className = "file-mode-indicator";
    el.textContent = "External Graph";
    panel.appendChild(el);
  }
}

function openFileGraph(data) {
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    alert("Invalid graph file: expected { nodes: [], edges: [] }.");
    return;
  }
  _preFileState = { note: currentNote, mode };
  fileGraph = { nodes: data.nodes, edges: data.edges };
  fileGraphDirty = false;

  const first = fileGraph.nodes
    .filter(n => !n.is_deleted)
    .sort((a, b) => (a.created_at || "").localeCompare(b.created_at || ""))[0];
  setAppState(first ? { id: first.id, text: first.text_content } : null, first ? "view" : "new");
  updateFileModeUI();
}

async function saveFileGraph() {
  if (!fileGraph) return;
  const username = promptUsername();
  if (!username) return;
  const saveData = {
    nodes: fileGraph.nodes.filter(n => !n.is_deleted),
    edges: fileGraph.edges.filter(e => !e.is_deleted),
  };
  triggerDownload(applyUsername(saveData, username), "amelda-graph.json");
  fileGraphDirty = false;
}

function closeFileGraph() {
  if (!fileGraph) return;
  if (fileGraphDirty && !confirm("You have unsaved changes to the external graph. Close without saving?")) return;
  fileGraph = null;
  fileGraphDirty = false;
  const pre = _preFileState;
  _preFileState = null;
  setAppState(pre?.note || null, pre?.note ? (pre.mode || "view") : "new");
  updateFileModeUI();
}

async function triggerDownload(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  // Web Share API works on iOS where anchor-click download does not
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], filename, { type: "application/json" });
    if (navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file] }); return; }
      catch (err) { if (err.name !== "AbortError") console.error("Share failed:", err); }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function promptUsername() {
  const raw = prompt("Enter your username for this export.\n(No spaces allowed)");
  if (raw === null) return null;           // cancelled
  const name = raw.trim();
  if (!name) { alert("Username cannot be empty."); return null; }
  if (name.includes(" ")) { alert("Username cannot contain spaces."); return null; }
  return name;
}

function applyUsername(data, username) {
  const remap = (obj) => obj.creator === "local" ? { ...obj, creator: username } : obj;
  return { nodes: data.nodes.map(remap), edges: data.edges.map(remap) };
}

async function seedDatabase() {
  try {
    const res = await fetch("./amelda-default.json");
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) return;
    for (const node of data.nodes) await idbPut("nodes", node);
    for (const edge of data.edges) await idbPut("edges", edge);
  } catch (err) {
    console.warn("Could not load default graph:", err);
  }
}

async function init() {
  const hamburgerBtn  = document.getElementById("hamburger-btn");
  const hamburgerMenu = document.getElementById("hamburger-menu");
  hamburgerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburgerMenu.hidden = !hamburgerMenu.hidden;
  });
  document.addEventListener("click", () => { hamburgerMenu.hidden = true; });

  const rightPanelEl   = document.getElementById("panel-right");
  const leftPanelEl    = document.getElementById("panel-left");
  const rightOverlay   = document.getElementById("right-panel-overlay");
  const rightToggleBtn = document.getElementById("right-panel-toggle");
  const leftToggleBtn  = document.getElementById("left-panel-toggle");

  const closeAllMobilePanels = () => {
    rightPanelEl.classList.remove("mobile-open");
    leftPanelEl.classList.remove("mobile-open");
    rightOverlay.classList.remove("mobile-open");
  };
  const openRightPanel = () => { closeAllMobilePanels(); rightPanelEl.classList.add("mobile-open"); rightOverlay.classList.add("mobile-open"); };
  const openLeftPanel  = () => { closeAllMobilePanels(); leftPanelEl.classList.add("mobile-open");  rightOverlay.classList.add("mobile-open"); };

  rightToggleBtn.addEventListener("click", () =>
    rightPanelEl.classList.contains("mobile-open") ? closeAllMobilePanels() : openRightPanel()
  );
  leftToggleBtn.addEventListener("click", () =>
    leftPanelEl.classList.contains("mobile-open") ? closeAllMobilePanels() : openLeftPanel()
  );
  rightOverlay.addEventListener("click", closeAllMobilePanels);

  document.getElementById("theme-toggle").addEventListener("click", onThemeToggle);
  applyTheme(localStorage.getItem("theme") === "light");

  const openGraphInput = document.getElementById("open-graph-input");
  openGraphInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { openFileGraph(JSON.parse(ev.target.result)); }
      catch { alert("Could not parse file as JSON."); }
    };
    reader.readAsText(file);
    openGraphInput.value = ""; // reset so the same file can be reopened
  });
  document.getElementById("open-graph").addEventListener("click", () => openGraphInput.click());
  document.getElementById("save-graph").addEventListener("click", saveFileGraph);
  document.getElementById("close-graph").addEventListener("click", closeFileGraph);

  document.getElementById("export-all").addEventListener("click", async () => {
    const username = promptUsername();
    if (!username) return;
    const [nodes, edges] = await Promise.all([api.getNodes(), api.getEdges()]);
    await triggerDownload(applyUsername({ nodes, edges }, username), "amelda-all.json");
  });

  document.getElementById("export-connected").addEventListener("click", async () => {
    if (!currentNote) { alert("No note is focused."); return; }
    const username = promptUsername();
    if (!username) return;
    const [nodes, edges] = await Promise.all([api.getNodes(), api.getEdges()]);
    await triggerDownload(applyUsername(exportConnected(currentNote.id, nodes, edges), username), "amelda-connected.json");
  });

  const existingNodes = await api.getNodes();
  const isFirstLaunch = !existingNodes.length;
  if (isFirstLaunch) await seedDatabase();

  try {
    const state = await api.getState();
    if (state.current_note_id) {
      const node = await api.getNode(state.current_note_id);
      if (node) currentNote = { id: node.id, text: node.text_content };
    }
    mode = currentNote ? state.mode : "new";
  } catch (err) {
    console.error("Failed to restore state:", err);
  }

  if (isFirstLaunch && !currentNote) {
    const [seededNodes, seededEdges] = await Promise.all([api.getNodes(), api.getEdges()]);
    if (seededNodes.length) {
      const seqToIds = new Set(
        seededEdges.filter(e => e.relationship_type === "sequence" && !e.is_deleted).map(e => e.to_id)
      );
      const head = seededNodes.find(n => !seqToIds.has(n.id)) || seededNodes[0];
      currentNote = { id: head.id, text: head.text_content };
      mode = "view";
    }
  }

  render();
}

init();
