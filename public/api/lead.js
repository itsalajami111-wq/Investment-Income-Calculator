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
            "str:cm:first-name": data.firstName,
            "str:cm:last-name": data.lastName,
            "str:cm:email": data.email,
            "phn:cm:phone": { c: "", n: data.phone },

            "str:cm:country": countryCode,

            "str:cm:answers": JSON.stringify({
              toolUsed: "Investment Income Calculator",
              calculatorInputs: data.inputs,
              calculatorResults: data.results,
              riskAnswers: data.riskAnswers
            })
          },

          fields: {
            "str::email": data.email
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

    const text = await orttoResp.text();

    if (!orttoResp.ok) {
      return res.status(500).json({ error: text });
    }

    return res.status(200).json({ success: true });

  } catch (err) {

    return res.status(500).json({ error: err.message });

  }

}

function getCountryCode(name) {

  const map = {
    "United Arab Emirates": "AE",
    "Saudi Arabia": "SA",
    "United Kingdom": "GB",
    "United States": "US",
    "India": "IN",
    "Canada": "CA",
    "Australia": "AU"
  };

  return map[name] || "";
}
