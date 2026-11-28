var appVersion = "7.1.0";

const electron = window.require("electron");

const GRID_COLUMNS = 8;

const uiStrings = {
  en: {
    placeholder: "Search emoji or shortcut",
    help:
      "Use 'Control + E' to summon Geniemoji</br></br>" +
      "Arrow Keys to navigate</br>" +
      "Enter to type the Emoji</br>" +
      "Escape to close</br></br>" +
      "Add text shortcuts from the tray menu",
    credit:
      '<a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> is ' +
      'developed by <a href="https://virejdasani.github.io/virej/" target="_blank">Virej Dasani</a>',
    noMatch: "No matching emojis found 😢",
  },
  es: {
    placeholder: "Buscar emoji o atajo",
    help:
      "Usa 'Control + E' para abrir Geniemoji</br></br>" +
      "Flechas para navegar</br>" +
      "Enter para escribir el emoji</br>" +
      "Escape para cerrar</br></br>" +
      "Agrega atajos de texto desde el menú de la bandeja",
    credit:
      '<a href="https://virejdasani.github.io/Geniemoji/" target="_blank">Geniemoji</a> fue ' +
      'desarrollado por <a href="https://virejdasani.github.io/virej/" target="_blank">Virej Dasani</a>',
    noMatch: "No se encontraron emojis 😢",
  },
};

let language = "en";
let viewStyle = "list";
// "system": the OS emoji font, with images only for what it cannot draw
// "twemoji" / "openmoji": every emoji drawn with that image set
let emojiStyle = "system";
var searchCommand;
let currentEmojis = [];
let selectedIndex = 0;
// Results are rendered in chunks; a broad query ("c") matches thousands of emojis
const RENDER_CHUNK = 80;
let renderedCount = 0;
let searchSeq = 0;

function t() {
  return uiStrings[language] || uiStrings.en;
}

function emojiName(item) {
  if (language === "es") {
    return item.name_es || item.name;
  }
  return item.name;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function refreshView() {
  const strings = t();
  const input = document.getElementById("commandInput");
  input.placeholder = strings.placeholder;
  document.body.classList.toggle("view-grid", viewStyle === "grid");
  document.body.classList.toggle("view-list", viewStyle !== "grid");

  if (input.value) {
    search();
  } else {
    currentEmojis = [];
    selectedIndex = 0;
    document.getElementById("answer").innerHTML = `
      <div id="info">
        ${strings.help}
      </div>
      <div id="credit">
        ${strings.credit}
      </div>
    `;
  }
}

function applyLanguage(nextLanguage) {
  language = nextLanguage === "es" ? "es" : "en";
  refreshView();
}

function applyViewStyle(nextViewStyle) {
  viewStyle = nextViewStyle === "grid" ? "grid" : "list";
  refreshView();
}

function focusSearchInput() {
  const input = document.getElementById("commandInput");
  if (input) input.focus();
}

function applySelectionHighlight() {
  ensureRendered(selectedIndex);
  document
    .querySelectorAll(".emojiButton.selected")
    .forEach((button) => button.classList.remove("selected"));
  const selected = document.querySelector(
    `.emojiButton[data-index="${selectedIndex}"]`
  );
  if (selected) {
    selected.classList.add("selected");
    selected.scrollIntoView({ block: "nearest" });
  }
}

function selectEmojiAt(index) {
  if (!currentEmojis.length) return;
  const max = currentEmojis.length - 1;
  selectedIndex = Math.max(0, Math.min(max, index));
  applySelectionHighlight();
  focusSearchInput();
}

function moveSelection(delta) {
  if (!currentEmojis.length) return;
  const max = currentEmojis.length;
  selectedIndex = (selectedIndex + delta + max) % max;
  applySelectionHighlight();
  focusSearchInput();
}

function moveSelectionVertical(direction) {
  if (!currentEmojis.length) return;
  if (viewStyle === "grid") {
    selectEmojiAt(selectedIndex + direction * GRID_COLUMNS);
  } else {
    moveSelection(direction);
  }
}

// Search as the user types. Use 'input' (not keyup) so arrow-key navigation does not reset selection.
document.getElementById("commandInput").addEventListener("input", search);

// Render the next chunk of results when scrolling near the bottom
document.getElementById("answer").addEventListener("scroll", (event) => {
  const el = event.currentTarget;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    renderMore(RENDER_CHUNK);
  }
});

Promise.all([
  electron.ipcRenderer.invoke("getLanguage"),
  electron.ipcRenderer.invoke("getViewStyle"),
  electron.ipcRenderer.invoke("getEmojiStyle"),
]).then(([nextLanguage, nextViewStyle, nextEmojiStyle]) => {
  language = nextLanguage === "es" ? "es" : "en";
  viewStyle = nextViewStyle === "grid" ? "grid" : "list";
  emojiStyle = normalizeEmojiStyle(nextEmojiStyle);
  refreshView();
  warmGlyphSupportCache();
});

electron.ipcRenderer.on("emoji-style-changed", (_event, nextEmojiStyle) => {
  emojiStyle = normalizeEmojiStyle(nextEmojiStyle);
  refreshView();
});

electron.ipcRenderer.on("language-changed", (_event, nextLanguage) => {
  applyLanguage(nextLanguage);
});
electron.ipcRenderer.on("view-style-changed", (_event, nextViewStyle) => {
  applyViewStyle(nextViewStyle);
});

// For app update, if an update is available, the updateAvailable in the RemoteJSON repo will be updated to yes. That will result in the code below being executed
fetch("https://virejdasani.github.io/RemoteJSON/Geniemoji/index.html")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    // If update is available, and this version is not the latest one, the update div will no longer be empty. It will have the following HTML
    if (data.updateAvailable == "yes" && data.latestVersion != appVersion) {
      document.getElementById("update").innerHTML = `
                <div id="update">
                    ${data.updateText}
                    Download update <!-- (${data.latestVersion}) --> <a href="${data.updateURL}" target="_blank">here</a>
                </div>
            `;
    }
  })
  .catch((err) => {
    // console.log(err)
  });

const TWEMOJI_VERSION = "17.0.3";
// The npm package is used because jsDelivr refuses the OpenMoji GitHub repo (over 50 MB)
const OPENMOJI_VERSION = "17.0.0";
const ZWJ = "200D";

function normalizeEmojiStyle(value) {
  return value === "twemoji" || value === "openmoji" ? value : "system";
}
// Unicode 17 joiners that Windows still draws as separate people + object.
const UNSUPPORTED_ZWJ_JOINERS = new Set(["1FAEF", "1F430"]);

// Windows Segoe UI Emoji does not draw country flags (shows "MX", "US", etc.).
// It also cannot compose some multi-person ZWJ sequences (wrestling, bunny ears).
// Render those with Twemoji images in the UI; clipboard still gets the real emoji.
function isFlagEmoji(item) {
  const codes = item.codes.split(" ");
  if (codes.length === 2) {
    const a = parseInt(codes[0], 16);
    const b = parseInt(codes[1], 16);
    return (
      a >= 0x1f1e6 &&
      a <= 0x1f1ff &&
      b >= 0x1f1e6 &&
      b <= 0x1f1ff
    );
  }
  // England / Scotland / Wales tag sequences
  return codes[0] === "1F3F4" && codes.some((c) => c.startsWith("E00"));
}

// Emoji 18.0 base code points. Twemoji 17.0.3 and OpenMoji 17.0.0 have no images for
// them; the OpenMoji ones are bundled in src/openmoji. With the Twemoji style they are
// hidden unless the system font can draw them, instead of showing a blank box.
const EMOJI_18_BASES = new Set([
  "1FAEB", "1FAF9", "1FAFA", "1FACC", "1FADD", "1F6D9", "1FA8B", "1FA8C", "1FA8D",
]);

// Detect whether the system emoji font can draw a sequence by drawing it on a
// small canvas: a missing glyph (tofu) is monochrome and follows fillStyle, while a
// color emoji does not; a sequence the font cannot compose is drawn about 2x wide.
// Drawing a color glyph the first time costs ~2ms, so only emojis using code points
// from U+1FA70 up (Emoji 12+, where system fonts lag behind) are probed, and results
// are cached for the session.
const PROBE_SIZE = 24;
const PROBE_MIN_CODE = 0x1fa70;
const glyphSupportCache = new Map();
let glyphProbe = null;

function mayBeUnsupported(item) {
  return item.codes
    .split(" ")
    .some((code) => parseInt(code, 16) >= PROBE_MIN_CODE);
}

function getGlyphProbe() {
  if (glyphProbe) return glyphProbe;
  const canvas = document.createElement("canvas");
  canvas.width = PROBE_SIZE;
  canvas.height = PROBE_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.font = `16px ${getComputedStyle(document.body).fontFamily}`;
  ctx.textBaseline = "top";
  glyphProbe = { ctx, refWidth: ctx.measureText("😀").width };
  return glyphProbe;
}

function drawGlyph(ctx, char, color) {
  ctx.clearRect(0, 0, PROBE_SIZE, PROBE_SIZE);
  ctx.fillStyle = color;
  ctx.fillText(char, 2, 2);
  return ctx.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE).data;
}

function canRenderNatively(item) {
  if (!item.codes || !mayBeUnsupported(item)) return true;
  const char = item.char;
  const cached = glyphSupportCache.get(char);
  if (cached !== undefined) return cached;

  const { ctx, refWidth } = getGlyphProbe();
  let supported = ctx.measureText(char).width <= refWidth * 1.4;
  if (supported) {
    const dark = drawGlyph(ctx, char, "#000");
    const light = drawGlyph(ctx, char, "#fff");
    let painted = 0;
    let followsFill = 0;
    for (let i = 3; i < dark.length; i += 4) {
      if (!dark[i] && !light[i]) continue;
      painted++;
      if (Math.abs(dark[i - 3] - light[i - 3]) > 64) followsFill++;
    }
    supported = painted > 0 && followsFill < painted / 2;
  }
  glyphSupportCache.set(char, supported);
  return supported;
}

function isEmoji18(item) {
  return EMOJI_18_BASES.has(item.codes.split(" ")[0]);
}

// With the Twemoji style, hide emojis that neither Twemoji nor the system font can show
function isDisplayable(item) {
  if (!item.codes || !isEmoji18(item)) return true;
  if (emojiStyle !== "twemoji") return true;
  return canRenderNatively(item);
}

// Probe the risky emojis while the app is idle so the first search does not pay for it
function warmGlyphSupportCache() {
  if (typeof requestIdleCallback !== "function") return;
  electron.ipcRenderer
    .invoke("getEmojisForSearchString", "")
    .then((all) => {
      const pending = all.filter((item) => item.codes && mayBeUnsupported(item));
      const step = (deadline) => {
        while (pending.length && deadline.timeRemaining() > 4) {
          canRenderNatively(pending.pop());
        }
        if (pending.length) requestIdleCallback(step);
      };
      requestIdleCallback(step);
    })
    .catch(() => {});
}

function isUnsupportedZwjEmoji(item) {
  const codes = item.codes.split(" ");
  if (!codes.includes(ZWJ)) return false;
  return codes.some((code) => UNSUPPORTED_ZWJ_JOINERS.has(code));
}

// System style only: whether the OS font needs an image stand-in for this emoji
function needsImageFallback(item) {
  if (emojiStyle !== "system" || !item || !item.codes) return false;
  return (
    isFlagEmoji(item) ||
    isUnsupportedZwjEmoji(item) ||
    !canRenderNatively(item)
  );
}

// Twemoji file names: lowercase hex without leading zeros, FE0F dropped unless the
// sequence has a ZWJ. A few ZWJ files drop FE0F too, so that is the fallback.
function twemojiUrls(item) {
  const codes = item.codes.split(" ");
  const base = `https://cdn.jsdelivr.net/gh/jdecked/twemoji@${TWEMOJI_VERSION}/assets/72x72/`;
  const toFile = (list) =>
    `${base}${list.map((c) => parseInt(c, 16).toString(16)).join("-")}.png`;
  const withoutFe0f = codes.filter((c) => c !== "FE0F");
  const primary = codes.includes(ZWJ) ? codes : withoutFe0f;
  const urls = [toFile(primary)];
  if (withoutFe0f.length !== primary.length) urls.push(toFile(withoutFe0f));
  return urls;
}

// OpenMoji file names: uppercase hex as listed, except a lone "X FE0F" is just "X"
function openmojiUrls(item) {
  let codes = item.codes.split(" ");
  if (codes.length === 2 && codes[1] === "FE0F") codes = [codes[0]];
  const file = `${codes.join("-")}.svg`;
  if (isEmoji18(item)) return [`../src/openmoji/${file}`];
  return [`https://cdn.jsdelivr.net/npm/openmoji@${OPENMOJI_VERSION}/color/svg/${file}`];
}

// Tries each URL in turn and falls back to the plain emoji text
function emojiImageHtml(item, urls) {
  return `<img class="emojiImage" src="${urls[0]}" data-fallbacks="${escapeAttr(
    urls.slice(1).join("|")
  )}" alt="${escapeAttr(item.char)}" draggable="false" onerror="nextEmojiImage(this)">`;
}

function nextEmojiImage(img) {
  const rest = (img.dataset.fallbacks || "").split("|").filter(Boolean);
  if (rest.length) {
    img.dataset.fallbacks = rest.slice(1).join("|");
    img.src = rest[0];
  } else {
    img.replaceWith(document.createTextNode(img.alt));
  }
}

function unsupportedMarkerHtml() {
  return `<span class="emojiUnsupported" aria-hidden="true">*</span>`;
}

// System style stand-in: Twemoji first, then OpenMoji (which has Emoji 18.0)
function systemFallbackHtml(item) {
  const urls = isEmoji18(item)
    ? openmojiUrls(item)
    : [...twemojiUrls(item), ...openmojiUrls(item)];
  return `${emojiImageHtml(item, urls)}${unsupportedMarkerHtml()}`;
}

function emojiDisplayHtml(item) {
  if (!item.codes) return item.char;
  if (emojiStyle === "twemoji") return emojiImageHtml(item, twemojiUrls(item));
  if (emojiStyle === "openmoji") return emojiImageHtml(item, openmojiUrls(item));
  if (!needsImageFallback(item)) return item.char;
  return systemFallbackHtml(item);
}

function truncatePreview(text, max = 36) {
  const value = String(text).replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

function renderEmojiButton(item, index) {
  const isShortcut = item.kind === "shortcut";
  const name = isShortcut ? item.name : emojiName(item);
  const title = escapeAttr(
    isShortcut ? `${item.name} → ${item.char}` : name
  );
  const selectedClass = index === selectedIndex ? " selected" : "";
  const shortcutClass = isShortcut ? " shortcutButton" : "";

  if (viewStyle === "grid") {
    if (isShortcut) {
      return `
        <button type="button" onclick="typeEmojiAt(${index})" class="emojiButton emojiGridButton shortcutGridButton${selectedClass}${shortcutClass}" title="${title}" data-index="${index}" tabindex="-1">
          <span class="shortcutTrigger">${escapeAttr(name)}</span>
        </button>
      `;
    }
    const unsupportedClass = needsImageFallback(item) ? " hasUnsupportedEmoji" : "";
    return `
      <button type="button" onclick="typeEmojiAt(${index})" class="emojiButton emojiGridButton${selectedClass}${unsupportedClass}" title="${title}" data-index="${index}" tabindex="-1">
        ${emojiDisplayHtml(item)}
      </button>
    `;
  }

  if (isShortcut) {
    return `
      <button type="button" onclick="typeEmojiAt(${index})" class="emojiButton${selectedClass}${shortcutClass}" title="${title}" data-index="${index}" tabindex="-1">
        <span class="shortcutTrigger">${escapeAttr(name)}</span>
        <span class="shortcutPreview">${escapeAttr(truncatePreview(item.char))}</span>
      </button>
      </br>
    `;
  }

  const unsupportedClass = needsImageFallback(item) ? " hasUnsupportedEmoji" : "";
  return `
    <button type="button" onclick="typeEmojiAt(${index})" class="emojiButton${selectedClass}${unsupportedClass}" data-index="${index}" tabindex="-1">
      ${emojiDisplayHtml(item)}
      ${name}
    </button>
    </br>
  `;
}

async function search() {
  const seq = ++searchSeq;
  searchCommand = document.getElementById("commandInput").value.toLowerCase();

  const results = await electron.ipcRenderer.invoke(
    "getEmojisForSearchString",
    searchCommand
  );
  // A newer keystroke already started another search; drop this result
  if (seq !== searchSeq) return;

  currentEmojis = results.filter(isDisplayable);
  selectedIndex = 0;
  renderedCount = 0;

  const answer = document.getElementById("answer");
  if (!currentEmojis.length) {
    const strings = t();
    answer.innerHTML = `
      <h3 id="displayedEmojiName">${strings.noMatch}</h3>
      <div id="credit">
        ${strings.credit}
      </div>
    `;
  } else {
    const listClass = viewStyle === "grid" ? "emojiGrid" : "emojiList";
    answer.innerHTML = `<div id="emojiResults" class="${listClass}"></div>`;
    answer.scrollTop = 0;
    renderMore(RENDER_CHUNK);
  }
  focusSearchInput();
}

function renderMore(count) {
  const list = document.getElementById("emojiResults");
  if (!list) return;
  const end = Math.min(currentEmojis.length, renderedCount + count);
  if (end <= renderedCount) return;
  let html = "";
  for (let i = renderedCount; i < end; i++) {
    html += renderEmojiButton(currentEmojis[i], i);
  }
  const start = renderedCount;
  list.insertAdjacentHTML("beforeend", html);
  renderedCount = end;
  replaceOverflowingEmojiGlyphs(list, start);
}

// Sequences the font cannot compose (e.g. two people + an object) overflow their grid
// cell; show those as Twemoji images. All widths are read before any button is changed
// so the browser lays out once per chunk instead of once per button.
function replaceOverflowingEmojiGlyphs(list, fromIndex) {
  if (viewStyle !== "grid" || emojiStyle !== "system") return;
  const overflowing = [];
  list.querySelectorAll(".emojiGridButton").forEach((button) => {
    if (Number(button.dataset.index) < fromIndex) return;
    if (button.classList.contains("shortcutGridButton")) return;
    if (button.querySelector(".emojiImage")) return;
    if (button.scrollWidth > button.clientWidth + 1) overflowing.push(button);
  });
  overflowing.forEach((button) => {
    const item = currentEmojis[Number(button.dataset.index)];
    if (!item || !item.codes) return;
    button.innerHTML = systemFallbackHtml(item);
    button.classList.add("hasUnsupportedEmoji");
  });
}

function ensureRendered(index) {
  if (index >= renderedCount) {
    renderMore(index - renderedCount + RENDER_CHUNK);
  }
}

// Enter types the highlighted emoji/shortcut, copies it, and closes Geniemoji
document.getElementById("commandInput").addEventListener("keydown", (e) => {
  if (e.code === "Enter" || e.code === "NumpadEnter") {
    e.preventDefault();
    typeEmojiAt(selectedIndex);
  }
});

function typeEmojiAt(index) {
  const item = currentEmojis[index];
  if (!item) return;
  // Keep recent-emoji history for emojis only
  if (item.kind !== "shortcut") {
    electron.ipcRenderer.send("selectEmoji", item.char);
  }
  electron.ipcRenderer.send("typeEmoji", item.char);
}

function typeEmoji(text) {
  electron.ipcRenderer.send("selectEmoji", text);
  electron.ipcRenderer.send("typeEmoji", text);
}

// Arrow keys move selection highlight without leaving the search input
document.addEventListener("keydown", (event) => {
  if (
    event.code !== "ArrowDown" &&
    event.code !== "ArrowUp" &&
    event.code !== "ArrowLeft" &&
    event.code !== "ArrowRight"
  ) {
    return;
  }
  if (!currentEmojis.length) return;

  event.preventDefault();

  if (event.code === "ArrowRight") {
    moveSelection(1);
  } else if (event.code === "ArrowLeft") {
    moveSelection(-1);
  } else if (event.code === "ArrowDown") {
    moveSelectionVertical(1);
  } else if (event.code === "ArrowUp") {
    moveSelectionVertical(-1);
  }
});
