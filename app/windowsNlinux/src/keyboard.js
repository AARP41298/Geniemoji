// Sends Ctrl+V to the focused window with the Win32 SendInput API (via koffi),
// so pasting does not need to launch a hidden PowerShell process.
// https://learn.microsoft.com/windows/win32/api/winuser/nf-winuser-sendinput

const INPUT_KEYBOARD = 1;
const KEYEVENTF_KEYUP = 0x0002;
const VK_CONTROL = 0x11;
const VK_V = 0x56;

let api = null;

function loadApi() {
  if (api) return api;
  const koffi = require("koffi");

  const MOUSEINPUT = koffi.struct("GM_MOUSEINPUT", {
    dx: "long",
    dy: "long",
    mouseData: "uint32",
    dwFlags: "uint32",
    time: "uint32",
    dwExtraInfo: "uintptr_t",
  });
  const KEYBDINPUT = koffi.struct("GM_KEYBDINPUT", {
    wVk: "uint16",
    wScan: "uint16",
    dwFlags: "uint32",
    time: "uint32",
    dwExtraInfo: "uintptr_t",
  });
  const HARDWAREINPUT = koffi.struct("GM_HARDWAREINPUT", {
    uMsg: "uint32",
    wParamL: "uint16",
    wParamH: "uint16",
  });
  const INPUT = koffi.struct("GM_INPUT", {
    type: "uint32",
    u: koffi.union("GM_INPUT_UNION", {
      mi: MOUSEINPUT,
      ki: KEYBDINPUT,
      hi: HARDWAREINPUT,
    }),
  });

  const user32 = koffi.load("user32.dll");
  const SendInput = user32.func(
    "uint32 __stdcall SendInput(uint32 cInputs, GM_INPUT *pInputs, int cbSize)"
  );
  api = { SendInput, inputSize: koffi.sizeof(INPUT) };
  return api;
}

const key = (wVk, up) => ({
  type: INPUT_KEYBOARD,
  u: {
    ki: {
      wVk,
      wScan: 0,
      dwFlags: up ? KEYEVENTF_KEYUP : 0,
      time: 0,
      dwExtraInfo: 0,
    },
  },
});

function sendCtrlV() {
  const { SendInput, inputSize } = loadApi();
  const inputs = [
    key(VK_CONTROL, false),
    key(VK_V, false),
    key(VK_V, true),
    key(VK_CONTROL, true),
  ];
  const sent = SendInput(inputs.length, inputs, inputSize);
  if (sent !== inputs.length) {
    throw new Error(`SendInput sent ${sent}/${inputs.length} key events`);
  }
}

module.exports = { sendCtrlV, _loadApi: loadApi };
