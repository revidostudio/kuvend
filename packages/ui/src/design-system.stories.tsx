import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, Check, Plus } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChoiceButton,
  EmptyState,
  ExternalResearchActions,
  Field,
  FileUploader,
  Input,
  Label,
  ProposalCard,
  PublicSiteFooter,
  PublicSiteHeader,
  SearchField,
  Skeleton,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  TrustNotice,
  Wizard,
} from "./index";

const meta = { title: "Kuvend/Design system", component: Button } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primitives: Story = {
  render: () => (
    <div className="grid w-[min(92vw,42rem)] gap-6 bg-[var(--kuvend-canvas)] p-6 text-[var(--kuvend-ink)]">
      <div className="flex flex-wrap gap-3">
        <Button>
          <Plus />
          Paraqit propozim
        </Button>
        <Button variant="outline">Kthehu</Button>
        <Button variant="secondary">
          <Bell />
          Njoftimet
        </Button>
        <Button disabled>Duke dërguar…</Button>
        <Badge>Votimi i hapur</Badge>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ChoiceButton selected>Pa emër</ChoiceButton>
        <ChoiceButton selected tone="success">
          Pro
        </ChoiceButton>
        <ChoiceButton selected tone="danger">
          Kundër
        </ChoiceButton>
      </div>
      <Field>
        <Label htmlFor="story-title">Titulli</Label>
        <Input id="story-title" placeholder="Një titull i qartë" />
      </Field>
      <SearchField aria-label="Kërko propozime" placeholder="Kërko propozime" />
      <Field>
        <Label htmlFor="story-body">Problemi</Label>
        <Textarea
          id="story-body"
          defaultValue="Përshkruaje problemin me fjalët e tua, pa pasur nevojë të njohësh gjuhën teknike."
        />
      </Field>
      <Alert>
        <Check />
        <AlertTitle>Gjithçka është gati</AlertTitle>
        <AlertDescription>Kontrollo versionin përfundimtar përpara publikimit.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const ProductPatterns: Story = {
  render: () => (
    <div className="grid w-[min(92vw,56rem)] gap-5 bg-[var(--kuvend-canvas)] p-6">
      <ProposalCard
        href="#"
        title="Më shumë pemë dhe hije në hapësirat publike"
        summary="Një plan i mirëmbajtur për mbjelljen e pemëve pranë shkollave, shesheve dhe stacioneve të transportit publik."
        category="Mjedis"
        location="Shqipëri"
        status="edhe 9 ditë"
        turnout={1248}
      />
      <TrustNotice>Shërbimi i propozimeve dhe votimit nuk e merr numrin e telefonit.</TrustNotice>
      <ExternalResearchActions
        actions={[
          {
            id: "chatgpt",
            label: "Pyet ChatGPT",
            description: "Kopjon një pyetje neutrale dhe hap ChatGPT.",
            icon: "chatgpt",
          },
          {
            id: "claude",
            label: "Pyet Claude",
            description: "Kopjon të njëjtën pyetje dhe hap Claude.",
            icon: "claude",
          },
          {
            id: "google",
            label: "Kërko në Google",
            description: "Kërkon burime dhe raportime të tjera në web.",
            icon: "google",
          },
        ]}
        onSelect={() => undefined}
      />
      <EmptyState
        title="Nuk u gjet asnjë propozim"
        description="Provo një fjalë tjetër ose hiq filtrat."
        action={<Button variant="outline">Pastro filtrat</Button>}
      />
      <FileUploader
        id="story-upload"
        accept="image/*"
        file={null}
        kind="image"
        onFileSelect={() => undefined}
        onRemove={() => undefined}
      />
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <Card className="w-[min(92vw,32rem)]">
      <CardHeader>
        <CardTitle>Gjendjet standarde</CardTitle>
        <CardDescription>
          Ngarkim, tekst i gjatë dhe gabime duhet të jenë të parashikueshme.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Spinner />
        <Skeleton className="h-24" />
        <Alert variant="destructive">
          <AlertTitle>Nuk mund të vazhdohet</AlertTitle>
          <AlertDescription>
            Kontrollo lidhjen dhe provo përsëri. Teksti yt mbetet në këtë pajisje.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  ),
};

export const MobileWizard: Story = {
  parameters: { viewport: { defaultViewport: "mobile390" }, layout: "fullscreen" },
  render: () => (
    <Wizard
      step={6}
      total={6}
      title="Konfirmo propozimin"
      back={() => undefined}
      next={() => undefined}
      nextLabel="Konfirmo"
    >
      <Card>
        <CardContent className="grid gap-3 p-4">
          <Badge>Mjedis</Badge>
          <CardTitle>Më shumë pemë dhe hije në hapësirat publike</CardTitle>
          <CardDescription>Ky është versioni që moderatorët do të shqyrtojnë.</CardDescription>
        </CardContent>
      </Card>
    </Wizard>
  ),
};

export const NavigationAndHelp: Story = {
  render: () => (
    <TooltipProvider>
      <div className="w-[min(92vw,36rem)] bg-[var(--kuvend-canvas)] p-6 text-[var(--kuvend-ink)]">
        <Tabs defaultValue="for">
          <TabsList>
            <TabsTrigger value="for">Argumente pro</TabsTrigger>
            <TabsTrigger value="against">Argumente kundër</TabsTrigger>
          </TabsList>
          <TabsContent value="for">Përfitimet e pritshme për komunitetin.</TabsContent>
          <TabsContent value="against">Kostoja dhe zbatimi kërkojnë sqarim.</TabsContent>
        </Tabs>
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" />}>Çfarë verifikohet?</TooltipTrigger>
          <TooltipContent>OTP provon kontrollin e një numri, jo identitetin.</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export const PublicChrome: Story = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="min-h-dvh bg-[var(--kuvend-canvas)] text-[var(--kuvend-ink)]">
      <PublicSiteHeader active="trust" />
      <main className="mx-auto min-h-96 max-w-[var(--kuvend-content)] px-4 py-12 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight">Qendra e besimit</h1>
      </main>
      <PublicSiteFooter />
    </div>
  ),
};
