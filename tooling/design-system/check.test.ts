import { describe, expect, it } from "vitest";
import { checkCss, checkTypescript } from "./check";

describe("design-system compliance fixtures", () => {
  it("accepts owned components and semantic tokens", () => {
    expect(
      checkTypescript(
        'import { Button } from "@kuvend/ui"; export const A=()=> <Button aria-label="Ruaj" />;',
        "apps/web/good.tsx",
      ),
    ).toEqual([]);
    expect(checkCss(".box { color: var(--kuvend-ink); }", "apps/web/good.css")).toEqual([]);
  });
  it.each([
    ["raw-interactive", "export const A=()=> <button>Ruaj</button>;"],
    ["base-ui-boundary", 'import { Button } from "@base-ui/react/button";'],
    [
      "accessible-name",
      'import { Button } from "@kuvend/ui"; export const A=()=> <Button><span /></Button>;',
    ],
    [
      "dialog-title",
      'import { DialogContent } from "@kuvend/ui"; export const A=()=> <DialogContent />;',
    ],
    ["browser-sdk", 'import posthog from "posthog-js";'],
    [
      "field-group-contract",
      "export const A=()=> <fieldset><legend>Prova</legend><p>Prova</p></fieldset>;",
    ],
  ])("rejects %s", (rule, source) =>
    expect(checkTypescript(source, "apps/web/bad.tsx").map((item) => item.rule)).toContain(rule),
  );
  it("accepts a fieldset with the repository field contract", () =>
    expect(
      checkTypescript(
        'import { FieldLegend, FieldDescription } from "@kuvend/ui"; export const A=()=> <fieldset aria-describedby="help"><FieldLegend>Prova</FieldLegend><FieldDescription id="help">Shto material.</FieldDescription></fieldset>;',
        "apps/web/good-fieldset.tsx",
      ),
    ).toEqual([]));
  it("rejects raw CSS colors", () =>
    expect(checkCss(".bad{color:#fff}", "apps/web/bad.css")[0]?.rule).toBe("raw-color"));
});
