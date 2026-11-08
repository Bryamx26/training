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
const offline = () => new TypeError("Failed to fetch");
const ALICE = 1;
const BOB = 2;

beforeEach(() => {
  store.clear();
  saveRealisation.mockReset();
});

describe("file d'attente hors ligne", () => {
  it("enregistre directement quand le réseau répond", async () => {
    saveRealisation.mockResolvedValue({});
    expect(await save(ALICE, 1, { series: [], v: 5 })).toBe("saved");
    expect(pendingCount()).toBe(0);
  });

  it("met en attente sans réseau, une seule saisie par séance et par compte", async () => {
    saveRealisation.mockRejectedValue(offline());
    expect(await save(ALICE, 1, { series: [], v: 5 })).toBe("queued");
    expect(await save(ALICE, 1, { series: [], v: 7 })).toBe("queued");
    expect(await save(ALICE, 2, { series: [], v: 3 })).toBe("queued");
    expect(await save(BOB, 1, { series: [], v: 9 })).toBe("queued");
    expect(pendingCount(ALICE)).toBe(2);
    expect(pendingCount(BOB)).toBe(1);
  });

  it("relance un refus définitif de l'API au lieu de la mettre en attente", async () => {
    saveRealisation.mockRejectedValue(httpError(403));
    await expect(save(ALICE, 1, {})).rejects.toThrow("refus");
    expect(pendingCount()).toBe(0);
  });

  it("met en attente une session expirée ou une panne du serveur", async () => {
    saveRealisation.mockRejectedValueOnce(httpError(401)).mockRejectedValueOnce(httpError(502));
    expect(await save(ALICE, 1, {})).toBe("queued");
    expect(await save(ALICE, 2, {})).toBe("queued");
    expect(pendingCount(ALICE)).toBe(2);
  });

  it("n'envoie jamais la saisie d'un compte avec la session d'un autre", async () => {
    saveRealisation.mockRejectedValue(offline());
    await save(ALICE, 1, { v: 1 });

    saveRealisation.mockReset();
    saveRealisation.mockResolvedValue({});
    expect(await flushQueue(BOB)).toBe(0);
    expect(saveRealisation).not.toHaveBeenCalled();
    expect(pendingCount(ALICE)).toBe(1);

    expect(await flushQueue(ALICE)).toBe(0);
    expect(saveRealisation).toHaveBeenCalledWith(1, { v: 1 });
    expect(pendingCount()).toBe(0);
  });

  it("au retour du réseau : envoie, abandonne les refus, garde les échecs passagers", async () => {
    saveRealisation.mockRejectedValue(offline());
    await save(ALICE, 1, { v: 7 });
    await save(ALICE, 2, { v: 3 });
    await save(ALICE, 3, { v: 1 });
    await save(ALICE, 4, { v: 2 });
    await save(ALICE, 5, { v: 4 });

    saveRealisation.mockReset();
    saveRealisation
      .mockResolvedValueOnce({}) // séance 1 envoyée
      .mockRejectedValueOnce(httpError(403)) // séance 2 refusée : abandonnée
      .mockRejectedValueOnce(offline()) // séance 3 : toujours hors ligne
      .mockRejectedValueOnce(httpError(401)) // séance 4 : session expirée, gardée
      .mockRejectedValueOnce(httpError(500)); // séance 5 : serveur en panne, gardée
    expect(await flushQueue(ALICE)).toBe(3);
    expect(saveRealisation).toHaveBeenCalledWith(1, { v: 7 });
  });

  it("ne perd pas une saisie ajoutée pendant l'envoi", async () => {
    saveRealisation.mockRejectedValue(offline());
    await save(ALICE, 1, { v: 1 });

    saveRealisation.mockReset();
    let release;
    saveRealisation.mockImplementationOnce(() => new Promise((r) => (release = r)));
    const flush = flushQueue(ALICE);

    // Pendant l'envoi : nouvelle saisie hors ligne.
    saveRealisation.mockRejectedValueOnce(offline());
    await save(ALICE, 2, { v: 2 });
    release({});
    expect(await flush).toBe(1);
    expect(pendingCount(ALICE)).toBe(1);
  });

  it("tente une saisie de l'ancienne version (sans profil) avec le compte connecté", async () => {
    store.set("realisations-en-attente", JSON.stringify([{ circuitId: 9, data: { v: 1 } }]));
    saveRealisation.mockRejectedValueOnce(httpError(403));
    expect(await flushQueue(BOB)).toBe(0);
    expect(pendingCount()).toBe(0);
  });
});
