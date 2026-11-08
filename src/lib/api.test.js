import { describe, it, expect } from "vitest";
import { resolveApiOrigin } from "./api";

describe("resolveApiOrigin", () => {
  it("vide : même origine que le front", () => {
    expect(resolveApiOrigin("", "192.168.1.20")).toBe("");
  });

  it("build locale ouverte depuis la machine elle-même : inchangée", () => {
    expect(resolveApiOrigin("http://localhost:4000", "localhost")).toBe("http://localhost:4000");
  });

  it("build locale ouverte depuis un autre appareil : vise la machine du front", () => {
    expect(resolveApiOrigin("http://localhost:4000/", "192.168.1.20")).toBe("http://192.168.1.20:4000");
    expect(resolveApiOrigin("http://127.0.0.1:4000", "pc-bryam.local")).toBe("http://pc-bryam.local:4000");
  });

  it("adresse publique : jamais modifiée", () => {
    expect(resolveApiOrigin("https://api.mon-domaine.fr", "sport.mon-domaine.fr")).toBe("https://api.mon-domaine.fr");
  });
});
