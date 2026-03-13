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

    const toolName = "Investment Income Calculator";

    const countryCode =
      data.countryCode ||
      getCountryCode(data.country) ||
      data.country ||
      "";

    const rawPhone = String(data.phone || "").trim();
    const { phoneCode, phoneNumber } = splitPhone(rawPhone);

    const orttoBody = {
      activities: [
        {
          activity_id: "act:cm:magnet-form-captured",
          attributes: {
            "str:cm:first-name": data.firstName || "",
            "str:cm:last-name": data.lastName || "",
            "str:cm:email": data.email || "",
            "phn:cm:phone": { c: phoneCode, n: phoneNumber },
            "str:cm:country": countryCode,

            "str:cm:answers": JSON.stringify({
              toolUsed: toolName,

              calculatorInputs: data.inputs || {},
              calculatorResults: data.results || {},

              riskAnswers: data.riskAnswers || {}
            })
          },

          fields: {
            "str::email": data.email || ""
          },

          location: {
            source_ip:
              req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null,
            custom: null,
            address: null
          }
        }
      ],

      merge_by: ["str::email"]
    };

    const orttoResp = await fetch("https://api.eu.ap3api.com/v1/person/merge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.ORTTO_API_KEY
      },
      body: JSON.stringify(orttoBody)
    });

    const orttoText = await orttoResp.text();

    if (!orttoResp.ok) {
      console.error("Ortto error:", orttoText);
      return res.status(500).json({ error: "Ortto failed", details: orttoText });
    }

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error("API error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}

function splitPhone(raw) {
  if (!raw) return { phoneCode: "", phoneNumber: "" };

  const match = raw.match(/^(\+\d{1,4})(.*)$/);

  if (match) {
    return {
      phoneCode: match[1],
      phoneNumber: match[2]
    };
  }

  return {
    phoneCode: "",
    phoneNumber: raw
  };
}

function getCountryCode(countryName) {

  const map = {
    "United Arab Emirates": "AE",
    "Saudi Arabia": "SA",
    "United Kingdom": "GB",
    "United States": "US",
    "India": "IN",
    "Canada": "CA",
    "Australia": "AU",
    "Germany": "DE",
    "France": "FR"
  };

  return map[countryName] || "";
}
