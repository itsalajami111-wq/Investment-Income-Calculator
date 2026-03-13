export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const orttoPayload = {
      activities: [
        {
          // IMPORTANT: use the full activity key
          activity_id: "act:cm:website_form_submit",

          attributes: {
            "str:cm:first-name": data.firstName || "",
            "str:cm:last-name": data.lastName || "",
            // standard email field so Ortto creates/updates the person
            "str::email": data.email || "",
            "phn:cm:phone": { c: "", n: data.phone || "" },
            "str:cm:country": data.country || "",
            // keep short to avoid Ortto length limits
            "str:cm:answers": "Investment Income Calculator"
          },

          location: {
            source_ip:
              (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
              null,
            custom: null,
            address: null
          }
        }
      ],
      merge_by: ["str::email"]
    };

    const resp = await fetch("https://api.eu.ap3api.com/v1/activities/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.ORTTO_API_KEY
      },
      body: JSON.stringify(orttoPayload)
    });

    const text = await resp.text();

    if (!resp.ok) {
      console.error("Ortto error:", text);
      return res.status(500).json({ error: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
