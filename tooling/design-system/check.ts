import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { Project, SyntaxKind } from "ts-morph";

export type Violation = { file: string; line: number; rule: string; message: string };
const interactive = new Set(["button", "input", "textarea", "select"]);
const browserSdk = /(?:posthog-js|@segment\/analytics|google-analytics|hotjar|mixpanel-browser)/;
const rawColor = /#[\da-f]{3,8}\b|rgba?\s*\(/i;
const visualOverride = /(?:^|\s)(?:bg|text|border|rounded|shadow|ring)-(?!\[var\(--kuvend-)/;
const primitives = new Set([
  "Button",
  "ChoiceButton",
  "Input",
  "SearchField",
  "ComboboxInput",
  "ComboboxTrigger",
  "ComboboxItem",
  "Textarea",
  "NativeSelect",
  "Checkbox",
  "CheckboxField",
  "RadioGroupItem",
  "TabsTrigger",
  "DialogContent",
  "SelectTrigger",
]);
const fieldControls = new Set([
  "Input",
  "SearchField",
  "ComboboxInput",
  "Textarea",
  "NativeSelect",
]);

export function checkTypescript(source: string, file = "fixture.tsx"): Violation[] {
  const project = new Project({ useInMemoryFileSystem: true, compilerOptions: { jsx: 4 } });
  const node = project.createSourceFile(file, source);
  const violations: Violation[] = [];
  const report = (line: number, rule: string, message: string) =>
    violations.push({ file, line, rule, message });
  for (const declaration of node.getImportDeclarations()) {
    const specifier = declaration.getModuleSpecifierValue();
    if (specifier.startsWith("@base-ui") && !file.includes("packages/ui/"))
      report(
        declaration.getStartLineNumber(),
        "base-ui-boundary",
        "Import Base UI only inside @kuvend/ui.",
      );
    if (browserSdk.test(specifier))
      report(
        declaration.getStartLineNumber(),
        "browser-sdk",
        "External behavioral browser SDKs are not approved.",
      );
  }
  for (const element of node
    .getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
    .concat(node.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement))) {
    const tag = element.getTagNameNode().getText();
    if (interactive.has(tag) && !file.includes("packages/ui/"))
      report(
        element.getStartLineNumber(),
        "raw-interactive",
        `Use @kuvend/ui instead of <${tag}>.`,
      );
    if (primitives.has(tag) && !file.includes("packages/ui/")) {
      const classAttribute = element.getAttribute("className");
      const value = classAttribute?.getText() ?? "";
      if (visualOverride.test(value))
        report(
          element.getStartLineNumber(),
          "primitive-override",
          `Do not visually restyle ${tag} in a feature.`,
        );
    }
    if (tag === "Checkbox" && !file.includes("packages/ui/"))
      report(
        element.getStartLineNumber(),
        "checkbox-field-contract",
        "Compose checkbox choices with CheckboxField from @kuvend/ui.",
      );
    if (fieldControls.has(tag) && !file.includes("packages/ui/")) {
      const attributes = element
        .getAttributes()
        .map((attribute) => attribute.getText())
        .join(" ");
      if (!/\b(id|aria-label|aria-labelledby)=/.test(attributes))
        report(
          element.getStartLineNumber(),
          "field-name-contract",
          `${tag} needs an id linked to a Label or an explicit accessible name.`,
        );
    }
    if (tag === "Button" && !file.includes("packages/ui/")) {
      const attributes = element
        .getAttributes()
        .map((attribute) => attribute.getText())
        .join(" ");
      const parent = element.getParent();
      const hasTextChild =
        parent
          .getDescendantsOfKind(SyntaxKind.JsxText)
          .some((child) => /[A-Za-zÀ-ž]{2}/.test(child.getText())) ||
        /["'][^"']*[A-Za-zÀ-ž]{2}/.test(parent.getText().replace(element.getText(), ""));
      if (!hasTextChild && !/(aria-label|aria-labelledby)/.test(attributes))
        report(
          element.getStartLineNumber(),
          "accessible-name",
          `${tag} needs visible text or an accessible name.`,
        );
    }
  }
  if (!file.includes("packages/ui/")) {
    for (const group of node.getDescendantsOfKind(SyntaxKind.JsxElement)) {
      if (group.getOpeningElement().getTagNameNode().getText() !== "fieldset") continue;
      const markup = group.getText();
      if (!markup.includes("<FieldLegend") || !markup.includes("<FieldDescription"))
        report(
          group.getStartLineNumber(),
          "field-group-contract",
          "Fieldsets require one shared FieldLegend and one FieldDescription from @kuvend/ui.",
        );
    }
  }
  if (source.includes("<DialogContent") && !source.includes("<DialogTitle"))
    report(1, "dialog-title", "DialogContent requires DialogTitle.");
  if (rawColor.test(source) && !file.includes("opengraph-image") && !file.includes("brand"))
    report(1, "raw-color", "Use a semantic token instead of a raw color.");
  if (/tailark(?:\.com|demo|cdn)/i.test(source) && !file.includes("tailark-updates.md"))
    report(1, "tailark-demo", "Tailark demo assets or runtime dependencies are forbidden.");
  return violations;
}

export function checkCss(source: string, file = "fixture.css"): Violation[] {
  if (file.endsWith("packages/ui/src/styles.css")) return [];
  const violations: Violation[] = [];
  const root = postcss.parse(source, { from: file });
  root.walkDecls((decl) => {
    if (rawColor.test(decl.value))
      violations.push({
        file,
        line: decl.source?.start?.line ?? 1,
        rule: "raw-color",
        message: "Use a semantic token instead of a raw CSS color.",
      });
  });
  return violations;
}

function filesBelow(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (["node_modules", "dist", ".next"].includes(entry.name)) return [];
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

export function checkRepository(root = process.cwd()): Violation[] {
  const files = [path.join(root, "apps"), path.join(root, "packages")].flatMap(filesBelow);
  return files.flatMap((file) => {
    const relative = path.relative(root, file);
    const source = readFileSync(file, "utf8");
    if (/\.(tsx?|jsx?)$/.test(file)) return checkTypescript(source, relative);
    if (file.endsWith(".css")) return checkCss(source, relative);
    return [];
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const violations = checkRepository();
  if (violations.length) {
    for (const item of violations)
      console.error(`${item.file}:${item.line} [${item.rule}] ${item.message}`);
    process.exitCode = 1;
  } else console.log("Design-system compliance passed.");
}
