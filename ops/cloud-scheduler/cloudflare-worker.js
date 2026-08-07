const DEFAULT_OWNER = "yj17671311024-ux";
const DEFAULT_REPO = "game-intelligence-report";
const DEFAULT_WORKFLOW = "daily-report.yml";

async function triggerGitHubWorkflow(env, reason = "scheduled") {
  const owner = env.GH_OWNER || DEFAULT_OWNER;
  const repo = env.GH_REPO || DEFAULT_REPO;
  const workflow = env.GH_WORKFLOW || DEFAULT_WORKFLOW;
  const token = env.GH_TOKEN;

  if (!token) throw new Error("GH_TOKEN secret is missing.");

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "game-intelligence-cloud-scheduler",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        force: "false",
      },
    }),
  });

  if (response.status !== 204) {
    const body = await response.text();
    throw new Error(`GitHub dispatch failed: ${response.status} ${body.slice(0, 500)}`);
  }

  return { ok: true, reason, workflow, repo: `${owner}/${repo}` };
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(triggerGitHubWorkflow(env, "cloudflare-cron"));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/run") return new Response("OK");
    if (env.TRIGGER_SECRET && request.headers.get("x-trigger-secret") !== env.TRIGGER_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }
    const result = await triggerGitHubWorkflow(env, "manual-http");
    return Response.json(result);
  },
};
