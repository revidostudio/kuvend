import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { Button, Field, Input, Label, ProposalCard, TrustNotice } from "./index";

describe("Kuvend UI", () => {
  it("keeps controls named and fields related", () => {
    render(
      <Field>
        <Label htmlFor="title">Titulli</Label>
        <Input id="title" />
        <Button>Vazhdo</Button>
      </Field>,
    );
    expect(screen.getByLabelText("Titulli")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vazhdo" })).toBeInTheDocument();
  });
  it("has no serious accessibility violations in core patterns", async () => {
    const { container } = render(
      <main>
        <ProposalCard
          href="/p/1"
          title="Një propozim i gjatë në shqip"
          summary="Përmbledhje e qartë."
          category="Mjedis"
          location="Shqipëri"
          status="Hapur"
        />
        <TrustNotice>Numri nuk i dërgohet Kuvendit.</TrustNotice>
      </main>,
    );
    const result = await axe.run(container, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      rules: { "color-contrast": { enabled: false } },
    });
    expect(
      result.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")),
    ).toEqual([]);
  });
});
