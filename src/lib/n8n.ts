export async function sendToN8n(payload: {
  job_id: string; release_id: string; title: string; body: string;
  excerpt: string; origin_language: string; origin_country: string;
  release_type: string; submitted_by: string; callback_url: string;
}) {
  const url    = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!url) { console.warn("[n8n] N8N_WEBHOOK_URL not set"); return { success: false }; }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Webhook-Secret": secret ?? "" },
      body: JSON.stringify(payload),
    });
    return { success: res.ok };
  } catch (err) {
    console.error("[n8n] error:", err);
    return { success: false };
  }
}
