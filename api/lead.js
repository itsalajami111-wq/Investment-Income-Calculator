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

    const countryCode = getCountryCode(data.country);

    const orttoBody = {
      activities: [
        {
          activity_id: "act:cm:magnet-form-captured",
          attributes: {
            "str:cm:first-name": data.firstName || "",
            "str:cm:last-name": data.lastName || "",
            "str:cm:email": data.email || "",
            "phn:cm:phone": { c: "", n: data.phone || "" },
            "str:cm:country": countryCode,
            "str:cm:answers": JSON.stringify({
  tool: "Investment Income Calculator",
  in: {
    y: data.inputs?.yieldPercent ?? null,
    a: data.inputs?.investmentAmount ?? null,
    i: data.inputs?.incomeValue ?? null,
    p: data.inputs?.incomePeriod ?? null,
    c: data.inputs?.compounding ?? null,
    yrs: data.inputs?.years ?? null
  },
  out: {
    ai: data.results?.annualIncome ?? null,
    mi: data.results?.monthlyIncome ?? null,
    sf: data.results?.solvedField ?? null,
    tpv: data.results?.totalProjectedValue ?? null,
    tie: data.results?.totalInterestEarned ?? null
  },
  risk: data.riskAnswers || {}
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

    const orttoResp = await fetch("https://api.eu.ap3api.com/v1/activities/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.ORTTO_API_KEY
      },
      body: JSON.stringify(orttoBody)
    });

    const text = await orttoResp.text();

    if (!orttoResp.ok) {
      console.error("Ortto error:", text);
      return res.status(500).json({ error: text });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("API error:", err);
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

  return map[name] || "";
}
