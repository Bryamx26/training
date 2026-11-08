import { describe, it, expect, vi, beforeEach } from "vitest";

const saveRealisation = vi.fn();
vi.mock("./api", () => ({ circuits: { saveRealisation: (...args) => saveRealisation(...args) } }));

// localStorage minimal (les tests tournent sous Node).
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const { saveRealisation: save, flushQueue, pendingCount } = await import("./offlineQueue");

const httpError = (status) => Object.assign(new Error("refus"), { status });

beforeEach(() => {
  store.clear();
  saveRealisation.mockReset();
});

describe("file d'attente hors ligne", () => {
  it("enregistre directement quand le réseau répond", async () => {
    saveRealisation.mockResolvedValue({});
    expect(await save(1, { series: [], v: 5 })).toBe("saved");
    expect(pendingCount()).toBe(0);
  });

  it("met en attente sans réseau, une seule saisie par séance", async () => {
    saveRealisation.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await save(1, { series: [], v: 5 })).toBe("queued");
    expect(await save(1, { series: [], v: 7 })).toBe("queued");
    expect(await save(2, { series: [], v: 3 })).toBe("queued");
    expect(pendingCount()).toBe(2);
  });

  it("relance une erreur de l'API au lieu de la mettre en attente", async () => {
    saveRealisation.mockRejectedValue(httpError(403));
    await expect(save(1, {})).rejects.toThrow("refus");
    expect(pendingCount()).toBe(0);
  });

  it("vide la file au retour du réseau et abandonne les refus", async () => {
    saveRealisation.mockRejectedValue(new TypeError("Failed to fetch"));
    await save(1, { series: [], v: 7 });
    await save(2, { series: [], v: 3 });
    await save(3, { series: [], v: 1 });

    saveRealisation.mockReset();
    saveRealisation
      .mockResolvedValueOnce({}) // séance 1 envoyée
      .mockRejectedValueOnce(httpError(403)) // séance 2 refusée : abandonnée
      .mockRejectedValueOnce(new TypeError("Failed to fetch")); // séance 3 : toujours hors ligne
    expect(await flushQueue()).toBe(1);
    expect(saveRealisation).toHaveBeenCalledWith(1, { series: [], v: 7 });
    expect(pendingCount()).toBe(1);
  });
});
