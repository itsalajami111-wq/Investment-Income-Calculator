export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const email = body.email || "";
    const firstName = body.firstName || "";
    const lastName = body.lastName || "";
    const phone = body.phone || "";
    const country = body.country || "";

    if (!email) {
      return res.status(400).json({ error: "Email missing from form" });
    }

    const payload = {
      activities: [
        {
          activity_id: "act:cm:website_form_submit",

          attributes: {
            "str:cm:first-name": firstName,
            "str:cm:last-name": lastName,
            "phn:cm:phone": { c: "", n: phone },
            "str:cm:country": country,
            "str:cm:answers": "Investment Calculator Lead"
          },

          fields: {
            "str::email": email
          }
        }
      ],

      merge_by: ["str::email"]
    };

    const response = await fetch(
      "https://api.eu.ap3api.com/v1/activities/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.ORTTO_API_KEY
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.text();

    if (!response.ok) {
      console.error("Ortto error:", result);
      return res.status(500).json({ error: result });
    }

    console.log("Ortto success:", result);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
}
