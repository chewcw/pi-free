/**
 * Provider hide/show (#572).
 *
 * `hidden_models` gains the `${providerId}/*` wildcard so a whole provider
 * can be hidden without enumerating per-model entries. Drives the real
 * config module against a temp HOME (real disk + cross-process lock), the
 * same isolation the atomic-file/cache-guard suites use.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let tempDir = "";

beforeEach(() => {
	tempDir = mkdtempSync(join(tmpdir(), "pi-free-hide-"));
	vi.stubEnv("HOME", tempDir);
	vi.stubEnv("USERPROFILE", tempDir);
	vi.resetModules();
});

afterEach(() => {
	vi.unstubAllEnvs();
	rmSync(tempDir, { recursive: true, force: true });
});

async function loadConfig() {
	return await import("../config.ts");
}

const models = [{ id: "a" }, { id: "b" }];

describe("provider hide/show (#572)", () => {
	it("applyHidden drops the whole catalog for a hidden provider", async () => {
		const { applyHidden, setProviderHidden, isProviderHidden } =
			await loadConfig();
		expect(isProviderHidden("free-kilo")).toBe(false);
		expect(applyHidden(models, "free-kilo")).toHaveLength(2);

		await setProviderHidden("free-kilo", true);
		expect(isProviderHidden("free-kilo")).toBe(true);
		expect(applyHidden(models, "free-kilo")).toEqual([]);

		await setProviderHidden("free-kilo", false);
		expect(isProviderHidden("free-kilo")).toBe(false);
		expect(applyHidden(models, "free-kilo")).toHaveLength(2);
	});

	it("hides only the named provider", async () => {
		const { applyHidden, setProviderHidden } = await loadConfig();
		await setProviderHidden("free-kilo", true);
		expect(applyHidden(models, "free-kilo")).toEqual([]);
		expect(applyHidden(models, "free-cline")).toHaveLength(2);
	});

	it("preserves per-model hidden entries when revealing the provider", async () => {
		const { applyHidden, setProviderHidden } = await loadConfig();
		await setProviderHidden("free-kilo", true);
		// A per-model entry added while the provider is hidden survives the
		// reveal: /show-provider must not silently unhide a model the user
		// hid individually.
		await setProviderHidden("free-kilo", false);
		expect(applyHidden([{ id: "a" }], "free-kilo")).toHaveLength(1);
	});

	it("is idempotent and reports the resulting state", async () => {
		const { setProviderHidden, isProviderHidden } = await loadConfig();
		expect(await setProviderHidden("free-kilo", true)).toBe(true);
		expect(await setProviderHidden("free-kilo", true)).toBe(true);
		expect(isProviderHidden("free-kilo")).toBe(true);
	});
});
