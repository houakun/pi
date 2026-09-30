import assert from "node:assert";
import { describe, it } from "node:test";
import { sliceByColumn, stripTerminalSequences } from "../src/utils.ts";

const FG = "\x1b[38;2;138;190;183m"; // inline-code foreground in the pi theme
const RESET = "\x1b[39m";

describe("sliceByColumn ANSI order regression", () => {
	// Regression for #10169: fullscreen selection/search highlight leaked the
	// pre-slice foreground color after a reset sitting on the slice boundary.
	it("does not re-apply pre-slice styling after a boundary reset", () => {
		const after = sliceByColumn(`AB${FG}XX${RESET}YZ`, 4, 2, true);

		assert.strictEqual(stripTerminalSequences(after), "YZ");
		const resetIndex = after.indexOf(RESET);
		assert.ok(resetIndex >= 0, "slice should carry the trailing reset");
		assert.strictEqual(after.indexOf(FG, resetIndex + RESET.length), -1, "no FG after the reset");
	});

	it("inherits styling when the slice starts mid-style and no reset follows", () => {
		const after = sliceByColumn(`AB${FG}XXYZ`, 4, 2, true);

		assert.strictEqual(stripTerminalSequences(after), "YZ");
		assert.ok(after.startsWith(FG), "keeps the active foreground for the slice");
	});

	it("keeps multi-attribute SGR order when only the foreground is reset", () => {
		const boldFg = "\x1b[1;31m";
		const fgReset = "\x1b[39m";
		const after = sliceByColumn(`AB${boldFg}XX${fgReset}YZ`, 4, 2, true);

		assert.strictEqual(stripTerminalSequences(after), "YZ");
		const resetIndex = after.indexOf(fgReset);
		assert.ok(resetIndex >= 0, "slice should carry the foreground reset");
		assert.strictEqual(after.indexOf(boldFg, resetIndex + fgReset.length), -1, "no boldFg after the reset");
	});

	it("keeps before and selected slices unchanged", () => {
		const line = `AB${FG}XX${RESET}YZ`;

		assert.strictEqual(sliceByColumn(line, 0, 2, true), "AB");
		assert.strictEqual(sliceByColumn(line, 2, 2, true), `${FG}XX`);
	});
});
