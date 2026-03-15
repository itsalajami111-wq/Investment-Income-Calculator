export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const email = String(data.email || "").trim();
    const countryName = String(data.country || "").trim();
    const phoneFull = String(data.phone || "").trim();

    if (!firstName || !lastName || !email || !countryName) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    if (!email.includes("@") || email.length > 254) {
      return res.status(400).json({ ok: false, error: "Invalid email" });
    }

    const countryCode = getCountryCode(countryName);

    const phoneParsed = splitPhone(phoneFull);

    const answersPayload = {
      tool: "Investment Income Calculator",
      calculatorInputs: data.inputs || {},
      calculatorResults: data.results || {},
      riskAnswers: data.riskAnswers || {}
    };

    const orttoBody = {
      activities: [
        {
          activity_id: "website_form_submit",
          attributes: {
            "phn:cm:phone-number": {
             c: phoneParsed.countryCodeDigits,
             n: phoneParsed.numberDigits
            },
            "str:cm:country-of-residence": countryCode,
            "str:cm:email": email,
            "str:cm:first-name": firstName,
            "str:cm:last-name": lastName,
            "str:cm:answers": "Investment Income Calculator submitted"
          },
          fields: {
            "str::email": email
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
      body: JSON.stringify(orttoBody)
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("Ortto error:", text);
      return res.status(502).json({ ok: false, error: text });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function splitPhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (!cleaned) {
    return { countryCodeDigits: "", numberDigits: "" };
  }

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1);
    if (digits.length <= 4) {
      return { countryCodeDigits: digits, numberDigits: "" };
    }

    // simple practical split for your current use
    const countryCodeDigits = digits.slice(0, 3);
    const numberDigits = digits.slice(3);
    return { countryCodeDigits, numberDigits };
  }

  return { countryCodeDigits: "", numberDigits: cleaned };
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

  return map[name] || name;
}
