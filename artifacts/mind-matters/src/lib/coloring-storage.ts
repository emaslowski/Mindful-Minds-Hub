const DATABASE_NAME = "brightside-coloring-drafts";
const STORE_NAME = "paintings";
const writesByTemplate = new Map<string, Promise<void>>();

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser does not support local draft storage."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local draft storage."));
    request.onblocked = () => reject(new Error("Local draft storage is blocked by another browser tab."));
  });
}

export async function loadColoringDraft(templateId: string): Promise<Blob | null> {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(templateId);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : null);
    request.onerror = () => reject(request.error ?? new Error("Could not read this local painting."));
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not read this local painting."));
    };
  });
}

async function writeColoringDraft(templateId: string, blob: Blob): Promise<void> {
  const database = await openDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(blob, templateId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not save this local painting."));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error("Local draft storage was unavailable."));
    };
  });
}

export function saveColoringDraft(templateId: string, blob: Blob): Promise<void> {
  const previous = writesByTemplate.get(templateId) ?? Promise.resolve();
  const write = previous.catch(() => undefined).then(() => writeColoringDraft(templateId, blob));
  const queued = write.finally(() => {
    if (writesByTemplate.get(templateId) === queued) writesByTemplate.delete(templateId);
  });
  writesByTemplate.set(templateId, queued);
  return queued;
}
