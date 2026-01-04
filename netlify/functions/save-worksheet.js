const fetch = global.fetch;

function b64EncodeUnicode(str) {
  return Buffer.from(str, "utf8").toString("base64");
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const auth = event.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return { statusCode: 401, body: JSON.stringify({ error: "Missing token" }) };
    }
    const token = auth.replace("Bearer ", "");

    const { content, message } = JSON.parse(event.body || "{}");
    if (!content) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing content" }) };
    }

    const repo = process.env.GITHUB_REPO;        // owner/repo
    const branch = process.env.GITHUB_BRANCH || "main";
    const path = "content/worksheet.json";

    // 1) 先抓現有檔案的 sha
    const getUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`;
    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "kaofloral-worksheet",
        Accept: "application/vnd.github+json",
      },
    });

    const getJson = await getRes.json();
    if (!getRes.ok) {
      return { statusCode: getRes.status, body: JSON.stringify(getJson) };
    }

    const sha = getJson.sha;
    const putUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

    // 2) PUT 更新檔案
    const putRes = await fetch(putUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "User-Agent": "kaofloral-worksheet",
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message || `Update worksheet.json (${new Date().toISOString()})`,
        content: b64EncodeUnicode(content),
        sha,
        branch,
      }),
    });

    const putJson = await putRes.json();
    if (!putRes.ok) {
      return { statusCode: putRes.status, body: JSON.stringify(putJson) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        commit: putJson.commit && putJson.commit.sha,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
