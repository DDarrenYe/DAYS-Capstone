"use client";

import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useId, useState } from "react";
import { z } from "zod";

import { CritiqueSidebar } from "@/app/student/log/critique-sidebar";
import { LinkImport } from "@/app/student/log/link-import";
import { Center } from "@/app/student/log/part";
import { PasteForm } from "@/app/student/log/paste-form";
import type { LoggedStep } from "@/app/student/log/step-meta";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { usePersistentState } from "@/lib/local-state";

const draftSchema = z.object({
  answer: z.string(),
  prompt: z.string(),
  tool: z.string(),
  url: z.string(),
});

const EMPTY = { answer: "", prompt: "", tool: "ChatGPT", url: "" };

const TOOLS = ["ChatGPT", "Claude", "Gemini", "Copilot"];
const OTHER = "Other";

const ToolPicker = ({
  tool,
  onChange,
}: {
  tool: string;
  onChange: (tool: string) => void;
}) => {
  const id = useId();
  const choice = TOOLS.includes(tool) ? tool : OTHER;
  return (
    <div className="bg-muted/60 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-t-xl border-b px-4 py-3">
      <span className="text-body text-label font-emphasis" id={id}>
        Which AI did you use?
      </span>
      <ToggleGroup
        aria-labelledby={id}
        onValueChange={([next]) => {
          if (next) {
            onChange(next === OTHER ? "" : next);
          }
        }}
        value={[choice]}
      >
        {[...TOOLS, OTHER].map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {choice === OTHER ? (
        <div className="animate-rise">
          <label className="sr-only" htmlFor={`${id}-other`}>
            Name of the AI tool
          </label>
          <Input
            autoFocus
            className="w-48"
            density="compact"
            id={`${id}-other`}
            maxLength={100}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Name of the tool"
            value={tool}
          />
        </div>
      ) : null}
    </div>
  );
};

export const AddStep = ({
  projectId,
  steps,
  userId,
}: {
  projectId: string;
  steps: readonly LoggedStep[];
  userId: string;
}) => {
  const [draft, setDraft] = usePersistentState(
    `log:${projectId}:new`,
    draftSchema,
    EMPTY
  );
  const { tool, url, prompt, answer } = draft;
  const edit = (patch: Partial<typeof EMPTY>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const [, setStepParam] = useQueryState("step", parseAsString);
  const [mode, setMode] = useState("link");
  const canImport = tool.trim().toLowerCase() === "chatgpt";
  const view = canImport ? mode : "paste";

  const open = (firstStep: number | undefined) => {
    if (firstStep !== undefined) {
      setStepParam(String(firstStep));
    }
  };

  return (
    <>
      <Center>
        <div className="animate-swap mx-auto w-full max-w-3xl px-10 py-6 max-md:px-4">
          <p className="text-muted-foreground text-meta flex items-center gap-2">
            <span className="font-mono">Step {steps.length + 1} onwards</span>·
            <Badge variant="ai">Lane 2</Badge>
          </p>
          <h1 className="text-title mt-1 font-semibold">
            Add steps to your log
          </h1>
          <p className="text-muted-foreground mt-1.5 max-w-xl text-pretty">
            Bring in what you asked and what the AI said, exactly as it was
            said. You write your critique on the next screen.
          </p>
          <p className="text-muted-foreground mt-2 max-w-xl text-xs text-pretty">
            Added steps are saved to your log. Only you can read them until you
            submit, then your instructors can. A share link is fetched from
            ChatGPT by our server. Once the reflection check is on, submitted
            step text will be sent to a third-party AI provider.{" "}
            <Link className="text-ai-ink hover:underline" href="/privacy">
              Read the privacy notice
            </Link>
            .
          </p>

          <Card className="mt-5" variant="raised">
            <ToolPicker onChange={(next) => edit({ tool: next })} tool={tool} />
            <div className="p-4">
              <Tabs
                onValueChange={(value) =>
                  setMode(value === "paste" ? "paste" : "link")
                }
                value={view}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <TabsList>
                    <TabsTrigger disabled={!canImport} value="link">
                      <Icon className="size-3.5" name="link" />
                      Share link
                    </TabsTrigger>
                    <TabsTrigger value="paste">
                      <Icon className="size-3.5" name="note" />
                      Paste text
                    </TabsTrigger>
                  </TabsList>
                  {canImport ? null : (
                    <span className="text-faint text-label">
                      Link import works for ChatGPT shares. Paste this one.
                    </span>
                  )}
                </div>
                <TabsContent value="link">
                  <div className="animate-rise">
                    <LinkImport
                      onAdded={open}
                      onUrl={(next) => edit({ url: next })}
                      projectId={projectId}
                      url={url}
                      userId={userId}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="paste">
                  <div className="animate-rise">
                    <PasteForm
                      answer={answer}
                      onAdded={open}
                      onEdit={edit}
                      projectId={projectId}
                      prompt={prompt}
                      tool={tool}
                      userId={userId}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>
      </Center>
      <CritiqueSidebar sources={0} steps={steps} />
    </>
  );
};
