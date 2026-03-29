import OpenAI from "openai";

export type PromptPreset = "default" | "detailed" | "action";

export interface BriefingLLMOptions {
  promptPreset?: PromptPreset;
  /** 참석자 Gmail 스니펫 등 부가 맥락 */
  meetingContextHint?: string;
}

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
}

export interface WeekSummaryItem {
  dateYmd: string;
  summary: string;
  start: string;
  end: string;
}

export interface LLMProvider {
  generateBriefing(
    events: CalendarEvent[],
    options?: BriefingLLMOptions
  ): Promise<string>;
  generateBriefingStream(
    events: CalendarEvent[],
    options?: BriefingLLMOptions
  ): AsyncGenerator<string, void, unknown>;
  extractActionItems(text: string): Promise<string[]>;
  /** 주간 타임라인용 한국어 요약 */
  generateWeekSummary(items: WeekSummaryItem[]): Promise<string>;
}

export function getPresetInstructions(preset: PromptPreset): string {
  switch (preset) {
    case "detailed":
      return `작성 지침: 시간 순으로 정리하고, 각 일정의 목적·배경을 짧게 덧붙여 주세요. 참석자가 있으면 언급하세요.`;
    case "action":
      return `작성 지침: 오늘 해야 할 일·후속 조치·확인할 사항을 최우선으로 bullet 형태로 강조하세요.`;
    default:
      return `작성 지침: 핵심만 간결하게 한국어로 요약하세요.`;
  }
}

function buildWeekSummaryPrompt(items: WeekSummaryItem[]): string {
  const lines = items
    .map((i) => `- ${i.dateYmd} ${i.start} ~ ${i.end}: ${i.summary}`)
    .join("\n");
  return `다음은 선택한 7일간(오늘 기준 연속 주간)의 일정 목록입니다. 한국어로 3~6문장으로 요약해 주세요. 가장 바쁜 날, 중요해 보이는 일정, 전반적인 흐름을 짚어 주세요.

${lines}

주간 요약:`;
}

function buildBriefingUserPrompt(
  events: CalendarEvent[],
  options?: BriefingLLMOptions
): string {
  const preset = (options?.promptPreset ?? "default") as PromptPreset;
  const presetLine = getPresetInstructions(preset);
  const lines = events
    .map((e) => `- ${e.start} ~ ${e.end}: ${e.summary}`)
    .join("\n");

  let extra = "";
  if (options?.meetingContextHint?.trim()) {
    extra = `\n\n참석자 관련 최근 메일/스레드 맥락(참고):\n${options.meetingContextHint.slice(0, 8000)}`;
  }

  return `다음은 오늘의 일정입니다. ${presetLine}

${lines}
${extra}

위 일정을 바탕으로 요약:`;
}

class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateBriefing(
    events: CalendarEvent[],
    options?: BriefingLLMOptions
  ): Promise<string> {
    const prompt = buildBriefingUserPrompt(events, options);

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "";
  }

  async *generateBriefingStream(
    events: CalendarEvent[],
    options?: BriefingLLMOptions
  ): AsyncGenerator<string, void, unknown> {
    const prompt = buildBriefingUserPrompt(events, options);
    const stream = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    for await (const chunk of stream) {
      const t = chunk.choices[0]?.delta?.content;
      if (t) yield t;
    }
  }

  async extractActionItems(text: string): Promise<string[]> {
    const prompt = `다음 텍스트에서 실행 가능한 액션 아이템을 추출해주세요. 각 항목은 한 줄로 작성하고, 번호 없이 나열해주세요:

${text}

액션 아이템:`;

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || "";
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  async generateWeekSummary(items: WeekSummaryItem[]): Promise<string> {
    if (items.length === 0) return "";
    const prompt = buildWeekSummaryPrompt(items);
    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 400,
    });
    return response.choices[0]?.message?.content || "";
  }
}

class LMStudioProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(endpoint: string, model: string) {
    this.client = new OpenAI({
      baseURL: endpoint,
      apiKey: "lm-studio",
    });
    this.model = model;
  }

  async generateBriefing(
    events: CalendarEvent[],
    options?: BriefingLLMOptions
  ): Promise<string> {
    const prompt = buildBriefingUserPrompt(events, options);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "";
  }

  async *generateBriefingStream(
    events: CalendarEvent[],
    options?: BriefingLLMOptions
  ): AsyncGenerator<string, void, unknown> {
    const prompt = buildBriefingUserPrompt(events, options);
    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
      stream: true,
    });

    for await (const chunk of stream) {
      const t = chunk.choices[0]?.delta?.content;
      if (t) yield t;
    }
  }

  async extractActionItems(text: string): Promise<string[]> {
    const prompt = `다음 텍스트에서 실행 가능한 액션 아이템을 추출해주세요. 각 항목은 한 줄로 작성하고, 번호 없이 나열해주세요:

${text}

액션 아이템:`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || "";
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  async generateWeekSummary(items: WeekSummaryItem[]): Promise<string> {
    if (items.length === 0) return "";
    const prompt = buildWeekSummaryPrompt(items);
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 400,
    });
    return response.choices[0]?.message?.content || "";
  }
}

export function createLLMProvider(
  provider: "openai" | "lmstudio",
  config: {
    apiKey?: string;
    endpoint?: string;
    model?: string;
  }
): LLMProvider {
  if (provider === "openai") {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required");
    }
    return new OpenAIProvider(config.apiKey);
  }
  if (!config.endpoint || !config.model) {
    throw new Error("LM Studio endpoint and model are required");
  }
  return new LMStudioProvider(config.endpoint, config.model);
}
