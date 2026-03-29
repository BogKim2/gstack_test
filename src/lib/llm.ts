import OpenAI from "openai";

export interface LLMProvider {
  generateBriefing(events: CalendarEvent[]): Promise<string>;
  extractActionItems(text: string): Promise<string[]>;
}

export interface CalendarEvent {
  summary: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
}

class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateBriefing(events: CalendarEvent[]): Promise<string> {
    const prompt = `다음은 오늘의 일정입니다. 간결하고 명확한 한국어로 요약해주세요:

${events.map((e) => `- ${e.start} ~ ${e.end}: ${e.summary}`).join("\n")}

요약:`;

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "";
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
}

class LMStudioProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(endpoint: string, model: string) {
    this.client = new OpenAI({
      baseURL: endpoint,
      apiKey: "lm-studio", // LM Studio는 API 키가 필요 없지만 형식상 필요
    });
    this.model = model;
  }

  async generateBriefing(events: CalendarEvent[]): Promise<string> {
    const prompt = `다음은 오늘의 일정입니다. 간결하고 명확한 한국어로 요약해주세요:

${events.map((e) => `- ${e.start} ~ ${e.end}: ${e.summary}`).join("\n")}

요약:`;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || "";
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
  } else {
    if (!config.endpoint || !config.model) {
      throw new Error("LM Studio endpoint and model are required");
    }
    return new LMStudioProvider(config.endpoint, config.model);
  }
}
