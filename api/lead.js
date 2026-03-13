export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const payload = {
      activities: [
        {
          activity_id: "website_form_submit",
          attributes: {
            "str:cm:first-name": data.firstName || "",
            "str:cm:last-name": data.lastName || "",
            "str::email": data.email || "",
            "phn:cm:phone": { c: "", n: data.phone || "" },
            "str:cm:country": data.country || "",
            "str:cm:answers": "Investment Income Calculator"
          },
          fields: {
            "str::email": data.email || ""
          }
        }
      ],
      merge_by: ["str::email"]
    };

    const response = await fetch("https://api.eu.ap3api.com/v1/activities/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.ORTTO_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Ortto error:", text);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(200).json({ success: true });
  }
}
