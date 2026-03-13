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
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const email = (body.email || "").trim();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const phone = (body.phone || "").trim();
    const country = getCountryCode(body.country || "");

    if (!email) {
      return res.status(400).json({ error: "Email missing from form" });
    }

    const payload = {
      activities: [
        {
          activity_id: "act:cm:website_form_submit",
          attributes: {
            "str:cm:answers": JSON.stringify({
              tool: "Investment Income Calculator"
            })
          },
          fields: {
            "str::email": email,
            "str::first": firstName,
            "str::last": lastName,
            "phn::phone": phone ? { c: "", n: phone } : null,
            "str:cm:country": country
          },
          location: {
            source_ip:
              (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null,
            custom: null,
            address: null
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

    const text = await response.text();

    if (!response.ok) {
      console.error("Ortto error:", text);
      return res.status(500).json({ error: text });
    }

    console.log("Ortto success:", text);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
}

function getCountryCode(name) {
  const map = {
    "United Arab Emirates": "AE",
    "Saudi Arabia": "SA",
    "Qatar": "QA",
    "Kuwait": "KW",
    "Bahrain": "BH",
    "Oman": "OM",
    "United Kingdom": "GB",
    "United States": "US",
    "Canada": "CA",
    "Australia": "AU",
    "India": "IN",
    "Pakistan": "PK",
    "South Africa": "ZA",
    "Singapore": "SG",
    "Hong Kong": "HK",
    "Germany": "DE",
    "France": "FR",
    "Spain": "ES",
    "Italy": "IT",
    "Netherlands": "NL",
    "Switzerland": "CH",
    "Ireland": "IE",
    "New Zealand": "NZ"
  };

  return map[name] || name || "";
}
