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
    // Parse body safely for Vercel
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
      return res.status(400).json({ error: "Email missing" });
    }

    const orttoPayload = {
      activities: [
        {
          activity_id: "act:cm:website_form_submit",

          attributes: {
            "str:cm:first-name": firstName,
            "str:cm:last-name": lastName,
            "str:cm:email": email,
            "phn:cm:phone": { c: "", n: phone },
            "str:cm:country": country,
            "str:cm:answers": "Investment Calculator Lead"
          },

          fields: {
            "str::email": email
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

    const response = await fetch(
      "https://api.eu.ap3api.com/v1/activities/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": process.env.ORTTO_API_KEY
        },
        body: JSON.stringify(orttoPayload)
      }
    );

    const text = await response.text();

    if (!response.ok) {
      console.error("Ortto error:", text);
      return res.status(500).json({ error: text });
    }

    console.log("Sent to Ortto:", text);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
}
