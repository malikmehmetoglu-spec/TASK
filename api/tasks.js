// Vercel serverless function: reads/writes data/tasks.json in the GitHub repo.
// Env vars: GITHUB_TOKEN (required), GITHUB_REPO (default malikmehmetoglu-spec/TASK),
// GITHUB_BRANCH (default main), APP_PASSWORD (optional, protects the API).
const REPO = process.env.GITHUB_REPO || "malikmehmetoglu-spec/TASK";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const PATH = "data/tasks.json";
const API = `https://api.github.com/repos/${REPO}/contents/${PATH}`;

const gh = (url, opts = {}) =>
  fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "task-tracker",
      ...(opts.headers || {}),
    },
  });

async function readFile() {
  const r = await gh(`${API}?ref=${BRANCH}&t=${Date.now()}`);
  if (r.status === 404) return { tasks: [], sha: null };
  if (!r.ok) throw new Error(`GitHub read failed: ${r.status}`);
  const j = await r.json();
  const text = Buffer.from(j.content, "base64").toString("utf8");
  return { tasks: JSON.parse(text || "[]"), sha: j.sha };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.GITHUB_TOKEN)
    return res.status(500).json({ error: "GITHUB_TOKEN غير مضبوط في Vercel" });
  if (process.env.APP_PASSWORD && req.headers["x-app-password"] !== process.env.APP_PASSWORD)
    return res.status(401).json({ error: "كلمة المرور غير صحيحة" });

  try {
    if (req.method === "GET") {
      const { tasks, sha } = await readFile();
      return res.status(200).json({ tasks, sha });
    }
    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      let { tasks, sha, message } = body || {};
      if (!Array.isArray(tasks)) return res.status(400).json({ error: "tasks must be an array" });
      const put = async (s) =>
        gh(API, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message || "تحديث المهام",
            content: Buffer.from(JSON.stringify(tasks, null, 2), "utf8").toString("base64"),
            branch: BRANCH,
            ...(s ? { sha: s } : {}),
          }),
        });
      let r = await put(sha);
      if (r.status === 409 || r.status === 422) {
        // sha conflict: refetch latest sha and retry once (client data wins)
        sha = (await readFile()).sha;
        r = await put(sha);
      }
      if (!r.ok) return res.status(r.status).json({ error: `GitHub write failed: ${r.status}` });
      const j = await r.json();
      return res.status(200).json({ sha: j.content.sha });
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
