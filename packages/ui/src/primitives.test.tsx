import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import {
  Button,
  ChoiceButton,
  Field,
  FieldDescription,
  FieldLegend,
  FileUploader,
  ExternalResearchActions,
  Input,
  Label,
  ProposalCard,
  PublicSiteFooter,
  PublicSiteHeader,
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
  it("does not select a provider before an explicit choice and restores focus", async () => {
    const selections: string[] = [];
    render(
      <ExternalResearchActions
        actions={[
          {
            id: "chatgpt",
            label: "Pyet ChatGPT",
            description: "Kopjon pyetjen dhe hap ChatGPT.",
            icon: "chatgpt",
          },
          {
            id: "google",
            label: "Kërko në Google",
            description: "Kërkon burime të tjera në web.",
            icon: "google",
          },
        ]}
        onSelect={(id) => selections.push(id)}
      />,
    );
    expect(selections).toEqual([]);
    const trigger = screen.getByRole("button", { name: "Hulumto me AI ose Google" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Ai mund të shohë adresën tënde IP/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Pyet ChatGPT/ }));
    expect(selections).toEqual(["chatgpt"]);
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it("keeps public navigation and trust links consistent across pages", () => {
    render(
      <>
        <PublicSiteHeader active="trust" />
        <main>
          <h1>Qendra e besimit</h1>
        </main>
        <PublicSiteFooter />
      </>,
    );
    expect(
      within(screen.getByRole("navigation", { name: "Kryesor" })).getByRole("link", {
        name: "Besimi",
      }),
    ).toHaveAttribute("aria-current", "page");
    fireEvent.click(screen.getByRole("button", { name: "Hap menunë" }));
    expect(screen.getByRole("navigation", { name: "Menuja celulare" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Qendra e besimit" })).toHaveAttribute(
      "href",
      "/besimi",
    );
    expect(screen.getByRole("link", { name: "privacy@kuvend.org" })).toHaveAttribute(
      "href",
      "mailto:privacy@kuvend.org",
    );
    expect(screen.getByRole("link", { name: "Propozo" })).toHaveAttribute(
      "href",
      "/?action=proposal",
    );
    expect(screen.getByRole("link", { name: "Njoftimet" })).toHaveAttribute(
      "href",
      "/?action=notifications",
    );
  });
});
