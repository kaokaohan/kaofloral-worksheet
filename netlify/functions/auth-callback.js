const fetch = global.fetch;

exports.handler = async (event) => {
  try {
    const code = event.queryStringParameters.code;
    if (!code) {
      return { statusCode: 400, body: "Missing code" };
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
      return {
        statusCode: 400,
        body: "Failed to get access token: " + JSON.stringify(tokenJson),
      };
    }

    // 導回 edit.html 並把 token 放在 hash（#token=...）
    const siteUrl =
      (event.headers["x-forwarded-proto"] || "https") +
      "://" +
      (event.headers["x-forwarded-host"] || event.headers.host);

    const redirectUrl = `${siteUrl}/edit.html#token=${encodeURIComponent(
      tokenJson.access_token
    )}`;

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl,
        "Cache-Control": "no-store",
      },
    };
  } catch (err) {
    return { statusCode: 500, body: "Auth callback error: " + err.message };
  }
};
