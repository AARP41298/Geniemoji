// Detects when a fullscreen app (game, presentation, fullscreen video) is in front,
// using the same Windows API that Focus Assist relies on.
// https://learn.microsoft.com/windows/win32/api/shellapi/nf-shellapi-shqueryusernotificationstate

const QUNS_BUSY = 2; // a fullscreen window (incl. borderless) is in front
const QUNS_RUNNING_D3D_FULL_SCREEN = 3; // exclusive fullscreen Direct3D game
const QUNS_PRESENTATION_MODE = 4; // presentation settings are on

let queryState = null;

function loadQuery() {
  if (queryState !== null) return queryState;
  queryState = false;
  if (process.platform !== "win32") return queryState;
  try {
    const koffi = require("koffi");
    const shell32 = koffi.load("shell32.dll");
    queryState = shell32.func(
      "int __stdcall SHQueryUserNotificationState(_Out_ int *state)"
    );
  } catch (err) {
    console.error("Fullscreen detection unavailable:", err.message);
  }
  return queryState;
}

function isSupported() {
  return !!loadQuery();
}

function isFullscreenAppRunning() {
  const query = loadQuery();
  if (!query) return false;
  const state = [0];
  if (query(state) !== 0) return false;
  return (
    state[0] === QUNS_BUSY ||
    state[0] === QUNS_RUNNING_D3D_FULL_SCREEN ||
    state[0] === QUNS_PRESENTATION_MODE
  );
}

// Calls onChange(true|false) whenever the fullscreen state flips. Returns a stop function.
function watchFullscreen(onChange, intervalMs = 1500) {
  if (!isSupported()) return () => {};
  let last = null;
  const tick = () => {
    let now = false;
    try {
      now = isFullscreenAppRunning();
    } catch (err) {
      now = false;
    }
    if (now !== last) {
      last = now;
      onChange(now);
    }
  };
  tick();
  const timer = setInterval(tick, intervalMs);
  return () => clearInterval(timer);
}

module.exports = { isSupported, isFullscreenAppRunning, watchFullscreen };
