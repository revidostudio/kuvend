import { fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import {
  Button,
  ChoiceButton,
  Field,
  FieldDescription,
  FieldLegend,
  FileUploader,
  Input,
  Label,
  ProposalCard,
  SearchField,
  TrustNotice,
} from "./index";

describe("Kuvend UI", () => {
  it("keeps controls named and fields related", () => {
    render(
      <Field>
        <Label htmlFor="title">Titulli</Label>
        <Input id="title" />
        <SearchField aria-label="Kërko propozime" />
        <Button>Vazhdo</Button>
        <ChoiceButton selected tone="success">
          Pro
        </ChoiceButton>
      </Field>,
    );
    expect(screen.getByLabelText("Titulli")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Kërko propozime" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vazhdo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pro" })).toHaveAttribute("aria-pressed", "true");
  });
  it("uses one consistent legend and related help text for grouped fields", () => {
    render(
      <fieldset aria-describedby="evidence-help">
        <FieldLegend optional>Prova dhe media</FieldLegend>
        <FieldDescription id="evidence-help">
          Shto vetëm materiale që mbështesin argumentin.
        </FieldDescription>
      </fieldset>,
    );
    expect(
      screen.getByRole("group", { name: "Prova dhe media Opsionale" }),
    ).toHaveAccessibleDescription("Shto vetëm materiale që mbështesin argumentin.");
    expect(screen.getAllByText("Prova dhe media")).toHaveLength(1);
  });
  it("keeps file selection uncontrolled and exposes preview progress", () => {
    const file = new File(["pamje"], "stacioni.png", { type: "image/png" });
    let selected: File | null = null;
    const { rerender } = render(
      <>
        <Label htmlFor="evidence-file">Skedari</Label>
        <FileUploader
          id="evidence-file"
          accept="image/*"
          file={null}
          kind="image"
          onFileSelect={(value) => {
            selected = value;
          }}
          onRemove={() => undefined}
        />
      </>,
    );
    fireEvent.change(screen.getByLabelText("Skedari"), { target: { files: [file] } });
    expect(selected).toBe(file);

    rerender(
      <FileUploader
        id="evidence-file"
        accept="image/*"
        file={file}
        kind="image"
        previewUrl="blob:preview"
        progress={100}
        status="ready"
        onFileSelect={() => undefined}
        onRemove={() => undefined}
      />,
    );
    expect(screen.getByAltText("Pamje paraprake e stacioni.png")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Përparimi i stacioni.png" })).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(screen.getByText("Gati për ngarkim")).toBeInTheDocument();
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
