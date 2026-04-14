import { NextResponse } from "next/server";

/**
 * Bonus Challenge 2: LLM "Next Best Action"
 * This endpoint calls the NVIDIA Qwen-122B model to provide
 * contextual project advice based on order metadata.
 */

interface NVIDIAChoice {
  message: {
    content: string | null;
    reasoning_content?: string;
  };
  finish_reason: string;
}

interface OrderPayload {
  order: {
    event_name: string;
    status: string;
    due_date: string;
    selected_print_type?: string;
  };
}

interface NVIDIAResponse {
  choices: NVIDIAChoice[];
}

export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text) {
      return NextResponse.json(
        { advice: "Check your order details for the next steps." },
        { status: 400 }
      );
    }
    
    const body = JSON.parse(text) as OrderPayload;
    const order = body.order;
    const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === "undefined") {
      console.warn("AI Assistant: Missing API Key");
      return NextResponse.json({
        advice: "Consult with your project manager for updates."
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta/llama-3.1-70b-instruct",
          messages: [
            {
              role: "system",
              content: `You are a helpful AI assistant for a custom apparel company advising a CUSTOMER.

Today's date is ${new Date().toISOString().split("T")[0]}.

Analyze the order data and return ONE clear "Next Best Step".

STRICT RULES:
- Must be under 20 words
- Do NOT invent tasks not relevant to the status
- Return ONLY plain text (no quotes, no extra formatting)
- Be clear, helpful, and concise

STATUS HANDLING:

- new:
  Tell customer to wait while designers prepare mockups

- proof_ready:
  Tell customer to review and approve designs ASAP

- revision_requested:
  Tell customer revisions are in progress and updated designs will be shared soon

- proof_pending:
  Tell customer designs are being prepared and will be shared shortly

- approved:
  Tell customer production has started and everything is on track

- in_production:
  Tell customer order is currently being printed

- shipped:
  Tell customer order has been shipped and will arrive soon

- complete:
  Tell customer order has been successfully completed

Use event name or print type if helpful, but keep it short.`,
            },
            {
              role: "user",
              content: `Project: ${order.event_name}. Status: ${order.status}. Deadline: ${order.due_date}. Print: ${order.selected_print_type}. Provide next step.`,
            },
          ],
          max_tokens: 150,
          temperature: 0.5,
          stream: false,
          chat_template_kwargs: { enable_thinking: false },
        }),
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("NVIDIA AI Error:", {
        status: response.status,
        body: errorText,
      });
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as NVIDIAResponse;
    const choice = data.choices[0];
    let advice =
      choice?.message?.content ||
      choice?.message?.reasoning_content ||
      "Check your order details for next steps.";

    advice = advice.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();

    if (choice?.finish_reason === "length" && !choice?.message?.content) {
      const lines = advice.split("\n").filter((l) => l.trim().length > 0);
      advice = lines[lines.length - 1] || advice;
    }

    return NextResponse.json({ advice: advice.trim().replace(/^"|"$/g, "") });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error("AI Assistant Error:", isTimeout ? "TIMEOUT" : err);
    
    return NextResponse.json({
      advice: "Check your order details for the next steps.",
    });
  }
}
