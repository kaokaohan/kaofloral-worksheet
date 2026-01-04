exports.handler = async (event) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const siteUrl =
    (event.headers["x-forwarded-proto"] || "https") +
    "://" +
    (event.headers["x-forwarded-host"] || event.headers.host);

  const redirect = new URL(siteUrl + "/.netlify/functions/auth-callback");
  const state = Math.random().toString(36).slice(2);

  // scope: repo 才能寫入私有/公開 repo（公開 repo 也常需要寫入權限）
  const authUrl =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirect.toString())}` +
    `&scope=${encodeURIComponent("repo")}` +
    `&state=${encodeURIComponent(state)}`;

  return {
    statusCode: 302,
    headers: {
      Location: authUrl,
      "Cache-Control": "no-store",
    },
  };
};
