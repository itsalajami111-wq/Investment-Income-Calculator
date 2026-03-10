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

    const results = data.results || {};
    const inputs = data.inputs || {};

    const orttoBody = {
      activities: [
        {
          activity_id: "act:cm:magnet-form-captured",
          attributes: {
            "str:cm:first-name": data.firstName || "",
            "str:cm:last-name": data.lastName || "",
            "str:cm:email": data.email || "",
            "phn:cm:phone": { c: phoneCode, n: phoneNumber },

            // keep same field, but send CODE instead of country name
            "str:cm:country": countryCode,

            "str:cm:answers": JSON.stringify({
              toolUsed: toolName,
              inputs: {
                yieldPercent: inputs.yieldPercent ?? null,
                investmentAmount: inputs.investmentAmount ?? null,
                incomeValue: inputs.incomeValue ?? null,
                incomePeriod: inputs.incomePeriod ?? "year",
                compounding: inputs.compounding ?? "annual",
                years: inputs.years ?? 10,
              },
              results: {
                annualIncome: results.annualIncome ?? 0,
                monthlyIncome: results.monthlyIncome ?? 0,
                solvedField: results.solvedField ?? "",
                totalProjectedValue: results.totalProjectedValue ?? 0,
                totalInterestEarned: results.totalInterestEarned ?? 0,
                chartPoints: results.chartPoints ?? [],
              },
            }),
          },
          fields: {
            "str::email": data.email || "",
          },
          location: {
            source_ip:
              req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null,
            custom: null,
            address: null,
          },
        },
      ],
      merge_by: ["str::email"],
    };

    const orttoResp = await fetch("https://api.eu.ap3api.com/v1/person/merge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": process.env.ORTTO_API_KEY,
      },
      body: JSON.stringify(orttoBody),
    });

    const orttoText = await orttoResp.text();

    if (!orttoResp.ok) {
      console.error("Ortto merge failed", orttoResp.status, orttoText);
      return res.status(500).json({
        success: false,
        error: "Ortto merge failed",
        details: orttoText,
      });
    }

    return res.status(200).json({
      success: true,
      ortto: orttoText,
    });
  } catch (error) {
    console.error("Lead API error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

function splitPhone(raw) {
  if (!raw) {
    return { phoneCode: "", phoneNumber: "" };
  }

  const cleaned = raw.replace(/\s+/g, "");
  const match = cleaned.match(/^(\+\d{1,4})(.*)$/);

  if (match) {
    return {
      phoneCode: match[1],
      phoneNumber: match[2] || "",
    };
  }

  return {
    phoneCode: "",
    phoneNumber: cleaned,
  };
}

function getCountryCode(countryName) {
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
    "New Zealand": "NZ",
  };

  return map[countryName] || "";
}
