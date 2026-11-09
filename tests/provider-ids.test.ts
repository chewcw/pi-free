import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
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

	it("keeps hardcoded plugin IDs out of source", () => {
		const bare = ["kilo", "cline", "commandcode", "zenmux", "qoder",
			"sambanova", "deepinfra", "ollama-cloud"];
		const hits: string[] = [];
		const walk = (dir: string): void => {
			for (const name of readdirSync(dir)) {
				const path = join(dir, name);
				if (statSync(path).isDirectory()) { walk(path); continue; }
				if (!path.endsWith(".ts")) continue;
				const text = readFileSync(path, "utf8");
				for (const id of bare) {
					if (text.includes(`"${id}"`)) {
						const allLines = text.split("\n");
						const bad = allLines.filter((l, i) => {
							if (!l.includes(`"${id}"`)) return false;
							// Logger names and upstream lookup names are not provider IDs.
							const prev = allLines[i - 1] ?? "";
							return !/createLogger|logWarning|cline-pass|legacy|kilo_show_paid|commandcode_show_paid|cline_show_paid/.test(prev + " " + l);
						});
						if (bad.length > 0) hits.push(`${path}: ${id}`);
					}
				}
			}
		};
		for (const dir of ["lib", "providers"]) walk(dir);
		if (readFileSync("index.ts", "utf8").includes('"sambanova"')) hits.push("index.ts: sambanova");
		expect(hits).toEqual([]);
	});
});
