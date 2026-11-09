import { describe, expect, it } from "vitest";
import {
	BUILT_IN_PROVIDER_IDS,
	PLUGIN_PROVIDER_IDS,
	PROVIDER_CLINE,
	PROVIDER_COMMANDCODE,
	PROVIDER_KILO,
	PROVIDER_OLLAMA,
	isPluginProviderId,
} from "../constants.ts";

describe("plugin provider IDs", () => {
	it("prefixes every plugin ID with free-", () => {
		expect(PROVIDER_KILO).toBe("free-kilo");
		expect(PROVIDER_CLINE).toBe("free-cline");
		expect(PROVIDER_COMMANDCODE).toBe("free-commandcode");
		expect(PROVIDER_OLLAMA).toBe("free-ollama-cloud");
	});

	it("keeps every plugin ID disjoint from Pi built-in IDs", () => {
		for (const id of PLUGIN_PROVIDER_IDS) {
			expect(id.startsWith("free-")).toBe(true);
			expect(BUILT_IN_PROVIDER_IDS).not.toContain(id);
		}
		expect(new Set(PLUGIN_PROVIDER_IDS).size).toBe(PLUGIN_PROVIDER_IDS.length);
	});

	it("recognizes plugin IDs and rejects built-in IDs", () => {
		expect(isPluginProviderId("free-kilo")).toBe(true);
		expect(isPluginProviderId("kilo")).toBe(false);
		expect(isPluginProviderId("openrouter")).toBe(false);
	});
});
