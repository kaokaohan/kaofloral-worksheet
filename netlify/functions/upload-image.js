// netlify/functions/upload-image.js
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    const auth = event.headers.authorization || event.headers.Authorization || "";
    const token = auth.replace("Bearer ", "").trim();
    if (!token) return json(401, { error: "Missing token" });

    const body = JSON.parse(event.body || "{}");
    const { filename, contentType, base64 } = body;

    if (!base64) return json(400, { error: "Missing base64" });

    // 你 repo 內要存圖片的資料夾
    const folder = "uploads";

    // 產一個不會撞名的檔名
    const ext = extFromType(contentType) || extFromName(filename) || "png";
    const stamp = new Date().toISOString().replace(/[-:]/g,"").slice(0,15); // YYYYMMDDTHHMMSS
    const rand = Math.random().toString(36).slice(2,8);
    const finalName = `${stamp}_${rand}.${ext}`;
    const path = `${folder}/${finalName}`;

    // 取得 repo 資訊（從環境變數）
    const owner = process.env.GH_OWNER;
    const repo = process.env.GH_REPO;
    const branch = process.env.GH_BRANCH || "main";
    if (!owner || !repo) return json(500, { error: "Missing GH_OWNER/GH_REPO env vars" });

    // 用 GitHub Contents API 寫入檔案（base64）
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "netlify-function",
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Upload image ${finalName}`,
        content: base64,
        branch
      })
    });

    const out = await putRes.json().catch(()=> ({}));
    if (!putRes.ok) {
      return json(putRes.status, { error: "GitHub upload failed", details: out });
    }

    // 回傳前端可直接用的網址（相對於站台）
    return json(200, { path: `/${path}` });
  } catch (e) {
    return json(500, { error: e?.message || String(e) });
  }
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj)
  };
}

function extFromType(type){
  if(type === "image/png") return "png";
  if(type === "image/jpeg") return "jpg";
  if(type === "image/webp") return "webp";
  return "";
}
function extFromName(name=""){
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  if(!m) return "";
  const ext = m[1];
  if(["png","jpg","jpeg","webp"].includes(ext)) return ext === "jpeg" ? "jpg" : ext;
  return "";
}
