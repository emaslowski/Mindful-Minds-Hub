/*
 * Mind Matters local-only Scratch hosting integration.
 * Copyright (C) 2026 Mind Matters contributors.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 * License and upstream source: ./vendor/LICENSE and ./sources.html
 */
(() => {
  "use strict";
  const root = document.getElementById("app");
  const base = new URL("./", document.currentScript.src);
  const vendor = new URL("vendor/", base);
  window.__MIND_MATTERS_SCRATCH_ASSET_BASE__ = vendor.href;
  window.addEventListener("error", (event) => {
    console.error("Scratch editor runtime failed", event.error || event.message);
  });

  function showError() {
    root.replaceChildren();
    const message = document.createElement("p");
    message.id = "error";
    message.setAttribute("role", "alert");
    message.textContent = "The editor could not load. Check your connection, then reload this page. Keep any saved .sb3 files on your computer.";
    root.append(message);
    if (window.parent !== window) {
      window.parent.postMessage({ type: "mind-matters:scratch-error" }, base.origin);
    }
  }

  // Some upstream libraries read cookies/storage during module initialization.
  // In a sandbox those real browser APIs throw. Supply empty cookies and
  // temporary settings storage instead; never grant access to the site's data.
  if (window.origin === "null") {
    try {
      Object.defineProperty(document, "cookie", {
        get: () => "",
        set: () => {},
      });
      for (const name of ["localStorage", "sessionStorage"]) {
        const values = new Map();
        Object.defineProperty(window, name, {
          value: {
            get length() { return values.size; },
            key: (index) => Array.from(values.keys())[index] ?? null,
            getItem: (key) => values.get(String(key)) ?? null,
            setItem: (key, value) => values.set(String(key), String(value)),
            removeItem: (key) => values.delete(String(key)),
            clear: () => values.clear(),
          },
        });
      }
    } catch (error) {
      console.error("Scratch sandbox compatibility failed", error);
      showError();
      return;
    }
  }

  // Blob workers work in an opaque-origin sandbox without giving the editor
  // access to the host's cookies, parent DOM, local storage, or signed-in session.
  const NativeWorker = window.Worker;
  if (NativeWorker) {
    window.Worker = class SandboxWorker extends NativeWorker {
      constructor(url, options) {
        const workerUrl = new URL(String(url), vendor);
        if (!workerUrl.href.startsWith(vendor.href) || options?.type === "module") {
          throw new Error("External editor workers are disabled.");
        }
        const blobUrl = URL.createObjectURL(new Blob(
          [`self.__MIND_MATTERS_SCRATCH_ASSET_BASE__=${JSON.stringify(vendor.href)};importScripts(${JSON.stringify(workerUrl.href)});`],
          { type: "text/javascript" },
        ));
        super(blobUrl, options);
        URL.revokeObjectURL(blobUrl);
      }
    };
  }

  const script = document.createElement("script");
  script.src = new URL("scratch-gui-standalone.js", vendor).href;
  script.onerror = showError;
  script.onload = () => {
    try {
      const scratch = window.GUI;
      const storage = new scratch.ScratchStorage();
      const cacheDefaults = (translator) => {
        scratch.buildDefaultProject(translator).forEach((asset) => {
          storage.builtinHelper._store(
            storage.AssetType[asset.assetType],
            storage.DataFormat[asset.dataFormat],
            asset.data,
            asset.id,
          );
        });
      };
      cacheDefaults();
      // Only the official, public Scratch asset library is configured. Projects
      // imported from the computer stay in memory; no project server exists here.
      storage.addWebStore(
        [storage.AssetType.ImageVector, storage.AssetType.ImageBitmap, storage.AssetType.Sound],
        (asset) => `https://assets.scratch.mit.edu/internalapi/asset/${asset.assetId}.${asset.dataFormat}/get/`,
      );
      const guiStorage = {
        scratchStorage: storage,
        setTranslatorFunction: cacheDefaults,
        saveProject: () => Promise.reject(new Error("Save to your computer instead.")),
      };
      const state = new scratch.EditorState(
        { locale: "en", isPlayerOnly: false, isEmbedded: false, showTelemetryModal: false },
        () => ({ storage: guiStorage }),
      );
      scratch.setAppElement(root);
      const editor = scratch.createStandaloneRoot(state, root);
      editor.render({
        basePath: vendor.href,
        canEditTitle: true,
        // This permission means creating a SERVER project, not File > New.
        // Leave it off so importing a local file never attempts a cloud save.
        canCreateNew: false,
        canSave: false,
        canShare: false,
        canRemix: false,
        canCreateCopy: false,
        canUseCloud: false,
        backpackVisible: false,
        showComingSoon: false,
        showTelemetryModal: false,
        onClickLogo: () => {},
      });
      // This is our own hosting message, not an assumed vendor API.
      if (window.parent !== window) {
        window.parent.postMessage({ type: "mind-matters:scratch-ready" }, base.origin);
      }
    } catch (error) {
      console.error("Scratch editor initialization failed", error);
      showError();
    }
  };
  document.head.append(script);
})();
