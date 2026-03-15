export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const firstName = String(data.firstName || "").trim();
    const lastName = String(data.lastName || "").trim();
    const email = String(data.email || "").trim();
    const countryName = String(data.country || "").trim();
    const phoneFull = String(data.phone || "").trim();

    if (!firstName || !lastName || !email || !countryName) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (!email.includes("@") || email.length > 254) {
      return res.status(400).json({ success: false, error: "Invalid email" });
    }

    const countryCode = getCountryCode(countryName);
    const phoneParsed = splitPhone(phoneFull);

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
            "str:cm:lead-source": "investment-calculator",
            "str:cm:answers": [
    `Yield:${data.inputs?.yieldPercent ?? ""}%`,
    `Amount:${data.inputs?.investmentAmount ?? ""}`,
    `Income:${data.results?.annualIncome ?? ""}`,
    `Projected:${data.results?.totalProjectedValue ?? ""}`,
    `Risk:${Object.values(data.riskAnswers || {}).join(",")}`
  ].join(" | ").slice(0, 300)
          },
          fields: {
            "str::email": email
          }
        }
      ],
      merge_by: ["str::email"]
    };

    console.log("USING SHORT ANSWERS VERSION");
    console.log(orttoBody.activities[0].attributes["str:cm:answers"]);
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
      return res.status(502).json({ success: false, error: text });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

function splitPhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, "");

  if (!cleaned) {
    return { countryCodeDigits: "", numberDigits: "" };
  }

  if (cleaned.startsWith("+971")) {
    return { countryCodeDigits: "971", numberDigits: cleaned.slice(4) };
  }

  return { countryCodeDigits: "", numberDigits: cleaned.replace(/\D/g, "") };
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
