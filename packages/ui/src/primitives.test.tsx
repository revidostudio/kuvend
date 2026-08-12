import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Button,
  ChoiceButton,
  CheckboxField,
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxTrigger,
  Field,
  FieldDescription,
  FieldLegend,
  FileUploader,
  ExternalResearchActions,
  Input,
  Label,
  NativeSelect,
  PhoneNumberField,
  ProposalCard,
  PublicSiteFooter,
  PublicSiteHeader,
  SearchField,
  TrustNotice,
} from "./index";

afterEach(cleanup);

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
  it("owns checkbox and select interaction states", () => {
    render(
      <>
        <CheckboxField defaultChecked onCheckedChange={() => undefined}>
          Transport
        </CheckboxField>
        <Label htmlFor="country">Shteti dhe kodi</Label>
        <NativeSelect id="country" defaultValue="AL">
          <option value="AL">Shqipëri (+355)</option>
          <option value="IT">Itali (+39)</option>
        </NativeSelect>
      </>,
    );
    expect(screen.getByRole("checkbox", { name: "Transport" })).toBeChecked();
    expect(screen.getByLabelText("Shteti dhe kodi")).toHaveValue("AL");
    fireEvent.click(screen.getByText("Transport"));
    expect(screen.getByRole("checkbox", { name: "Transport" })).not.toBeChecked();
  });
  it("provides an owned searchable country combobox", async () => {
    const { container } = render(
      <>
        <Label htmlFor="search-country">Shteti dhe kodi</Label>
        <Combobox items={["Shqipëri (+355)", "Gjermani (+49)", "Itali (+39)"]}>
          <ComboboxInputGroup>
            <ComboboxInput id="search-country" placeholder="Kërko shtetin ose kodin" />
            <ComboboxTrigger aria-label="Hap listën e shteteve" />
          </ComboboxInputGroup>
          <ComboboxPortal>
            <ComboboxPositioner>
              <ComboboxPopup>
                <ComboboxEmpty>Nuk u gjet asnjë shtet.</ComboboxEmpty>
                <ComboboxList>
                  {(country: string) => (
                    <ComboboxItem key={country} value={country}>
                      {country}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxPopup>
            </ComboboxPositioner>
          </ComboboxPortal>
        </Combobox>
      </>,
    );
    const input = container.querySelector<HTMLInputElement>("#search-country");
    expect(input).not.toBeNull();
    if (!input) throw new Error("searchable combobox input missing");
    fireEvent.click(screen.getByRole("button", { name: "Hap listën e shteteve" }));
    fireEvent.change(input, { target: { value: "Itali" } });
    expect(await screen.findByRole("option", { name: "Itali (+39)" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Gjermani (+49)" })).not.toBeInTheDocument();
  });
  it("combines a readable country picker and phone input into one field", async () => {
    const countries = [
      { value: "AL", label: "Shqipëri", callingCode: "355" },
      { value: "US", label: "Shtetet e Bashkuara", callingCode: "1" },
    ];
    render(
      <PhoneNumberField
        countries={countries}
        country={countries[0]!}
        onCountryChange={() => undefined}
        phoneInputProps={{ id: "phone", "aria-label": "Numri i WhatsApp" }}
      />,
    );
    expect(screen.getByLabelText("Shteti dhe kodi telefonik")).toHaveValue("Shqipëri (+355)");
    expect(screen.getByLabelText("Numri i WhatsApp")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Kërko ose ndrysho shtetin" }));
    expect(
      await screen.findByRole("option", { name: "Shtetet e Bashkuara +1" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Shqipëri +355" })).toBeVisible();
    expect(screen.getByRole("option", { name: "Shtetet e Bashkuara +1" })).toHaveTextContent(
      "Shtetet e Bashkuara+1",
    );
    fireEvent.change(screen.getByLabelText("Shteti dhe kodi telefonik"), {
      target: { value: "355" },
    });
    expect(await screen.findByRole("option", { name: "Shqipëri +355" })).toBeVisible();
  });
  it("selects a searched country while keeping the calling code readable", async () => {
    const onCountryChange = vi.fn();
    const countries = [
      { value: "AL", label: "Shqipëri", callingCode: "355" },
      { value: "US", label: "Shtetet e Bashkuara", callingCode: "1" },
    ];
    const { container } = render(
      <PhoneNumberField
        countries={countries}
        country={countries[0]!}
        onCountryChange={onCountryChange}
        phoneInputProps={{ id: "searchable-phone", "aria-label": "Numri i WhatsApp" }}
      />,
    );

    const countryInput = within(container).getByLabelText("Shteti dhe kodi telefonik");
    fireEvent.click(within(container).getByRole("button", { name: "Kërko ose ndrysho shtetin" }));
    fireEvent.change(countryInput, { target: { value: "Bashkuara" } });
    const option = await screen.findByRole("option", { name: "Shtetet e Bashkuara +1" });
    fireEvent.click(option);

    expect(onCountryChange).toHaveBeenCalledWith(countries[1]);
  });

  it("shows an accessible empty result for an unknown country search", async () => {
    const countries = [{ value: "AL", label: "Shqipëri", callingCode: "355" }];
    const { container } = render(
      <PhoneNumberField
        countries={countries}
        country={countries[0]!}
        onCountryChange={() => undefined}
        phoneInputProps={{ id: "empty-phone", "aria-label": "Numri i WhatsApp" }}
      />,
    );

    fireEvent.click(within(container).getByRole("button", { name: "Kërko ose ndrysho shtetin" }));
    fireEvent.change(within(container).getByLabelText("Shteti dhe kodi telefonik"), {
      target: { value: "Atlantida" },
    });

    expect(await screen.findByText("Nuk u gjet asnjë shtet.")).toBeVisible();
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
