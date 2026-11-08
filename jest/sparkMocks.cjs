const settingsStore = new Map();
const fsFiles = new Map();
const fsDirs = new Set(["/Users/test", "/Users/test/Library/Application Support/so.skillet.macos"]);
const clipboardState = { text: "" };
let dialogResult = { canceled: true };
let windowOptionsCalls = [];
let commandCalls = [];

module.exports = {
  // @legendapp/spark/dialogs
  openFileDialog: jest.fn(async () => dialogResult),
  __setDialogResult(next) {
    dialogResult = next;
  },

  // @legendapp/spark/windows
  setWindowOptions: jest.fn(async (id, options) => {
    windowOptionsCalls.push({ id, options });
  }),
  __getWindowOptionsCalls() {
    return windowOptionsCalls;
  },

  // @legendapp/spark/clipboard
  setStringAsync: jest.fn(async (text) => {
    clipboardState.text = text;
    return true;
  }),
  getStringAsync: jest.fn(async () => clipboardState.text),
  writeText: jest.fn(async (pathOrText, maybeContents) => {
    // Disambiguate clipboard.writeText(text) vs files.writeText(path, contents)
    if (typeof maybeContents === "string") {
      fsFiles.set(pathOrText, maybeContents);
      return;
    }
    clipboardState.text = pathOrText;
    return true;
  }),
  readText: jest.fn(async (targetPath) => {
    if (typeof targetPath === "string") {
      if (!fsFiles.has(targetPath)) {
        const err = new Error(`File not found: ${targetPath}`);
        err.code = "E_NOT_FOUND";
        throw err;
      }
      return fsFiles.get(targetPath);
    }
    return clipboardState.text;
  }),
  __getClipboardText() {
    return clipboardState.text;
  },

  // @legendapp/spark/files
  getDirectory: jest.fn(async () => "/Users/test/Library/Application Support/so.skillet.macos"),
  list: jest.fn(async (dirPath) => {
    if (!fsDirs.has(dirPath)) {
      const err = new Error(`Directory not found: ${dirPath}`);
      err.code = "E_NOT_FOUND";
      throw err;
    }
    const prefix = dirPath.endsWith("/") ? dirPath : `${dirPath}/`;
    const entries = new Map();
    for (const d of fsDirs) {
      if (d.startsWith(prefix)) {
        const rest = d.slice(prefix.length);
        const first = rest.split("/")[0];
        if (first && !entries.has(first)) {
          entries.set(first, { name: first, path: `${prefix}${first}`, type: "directory" });
        }
      }
    }
    for (const f of fsFiles.keys()) {
      if (f.startsWith(prefix)) {
        const rest = f.slice(prefix.length);
        const first = rest.split("/")[0];
        if (first && !entries.has(first)) {
          entries.set(first, {
            name: first,
            path: `${prefix}${first}`,
            type: rest.includes("/") ? "directory" : "file",
          });
        }
      }
    }
    return Array.from(entries.values());
  }),
  mkdir: jest.fn(async (dirPath) => {
    fsDirs.add(dirPath);
  }),
  remove: jest.fn(async (targetPath) => {
    fsDirs.delete(targetPath);
    fsFiles.delete(targetPath);
    const prefix = targetPath.endsWith("/") ? targetPath : `${targetPath}/`;
    for (const k of Array.from(fsFiles.keys())) {
      if (k.startsWith(prefix)) fsFiles.delete(k);
    }
    for (const d of Array.from(fsDirs)) {
      if (d.startsWith(prefix)) fsDirs.delete(d);
    }
  }),
  __setMockFs({ files = {}, dirs = [] } = {}) {
    fsFiles.clear();
    fsDirs.clear();
    fsDirs.add("/Users/test");
    fsDirs.add("/Users/test/Library/Application Support/so.skillet.macos");
    for (const d of dirs) fsDirs.add(d);
    for (const [k, v] of Object.entries(files)) fsFiles.set(k, v);
  },
  __getMockFs() {
    return { files: fsFiles, dirs: fsDirs };
  },

  // @legendapp/spark/processes
  runCommand: jest.fn(async (spec) => {
    commandCalls.push(spec);
    if (spec?.target?.path === "/bin/ln" && Array.isArray(spec.args) && spec.args[0] === "-s") {
      const [, source, target] = spec.args;
      fsDirs.add(target);
      const srcMd = fsFiles.get(`${source}/SKILL.md`);
      if (srcMd !== undefined) {
        fsFiles.set(`${target}/SKILL.md`, srcMd);
      }
    }
    return {
      exit: { type: "exited", code: 0 },
      stdout: new Uint8Array(),
      stderr: new Uint8Array(),
      timedOut: false,
      aborted: false,
      outputTruncated: false,
    };
  }),
  __getCommandCalls() {
    return commandCalls;
  },
  __resetCommandCalls() {
    commandCalls = [];
  },

  // @legendapp/spark/settings
  settings: {
    get: jest.fn(async (key) => settingsStore.get(key) ?? null),
    set: jest.fn(async (key, val) => {
      settingsStore.set(key, val);
    }),
    remove: jest.fn(async (key) => {
      settingsStore.delete(key);
    }),
  },
  __resetSettingsStore() {
    settingsStore.clear();
  },
};
