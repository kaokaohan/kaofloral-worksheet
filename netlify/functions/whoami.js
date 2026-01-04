const fetch = global.fetch;

exports.handler = async (event) => {
  try {
    const auth = event.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing token" }) };
    }
    const token = auth.replace("Bearer ", "");

    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "kaofloral-worksheet",
        Accept: "application/vnd.github+json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify(data) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        login: data.login,
        name: data.name,
        avatar_url: data.avatar_url,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
