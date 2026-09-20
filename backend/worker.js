/**
 * Cloudflare Worker Entry Point
 * Modular Architecture with RESTful /api/* routes and legacy compatibility.
 */
import { handleOptions, jsonError } from "./utils/response.js";
import { AppError } from "./utils/errors.js";
import { ADMIN_PORTAL_HTML } from "./views/adminPortal.js";

import { handleAuthRoutes } from "./routes/auth.js";
import { handleLicenseRoutes } from "./routes/licenses.js";
import { handleAgentRoutes } from "./routes/agents.js";
import { handleTemplateRoutes } from "./routes/templates.js";
import { handleEscalationRoutes } from "./routes/escalations.js";
import { handleAuditRoutes } from "./routes/audits.js";
import { handleSystemRoutes } from "./routes/system.js";
import { getSystemConfig } from "./services/systemService.js";

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      // 1. Handle HTTP OPTIONS preflight
      if (request.method === "OPTIONS") {
        return handleOptions();
      }

      // 2. Master Admin Portal UI (GET /admin or GET /admin/)
      if (url.pathname === "/admin" || url.pathname === "/admin/") {
        return new Response(ADMIN_PORTAL_HTML, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        });
      }

      // 3. GitHub CDN Proxy Endpoints for Zero-Cache Updates (Channel-Aware)
      if ((request.method === "GET" || request.method === "HEAD") && (
        url.pathname === "/bundle.js" ||
        url.pathname === "/loader.user.js" ||
        url.pathname === "/script.user.js" ||
        url.pathname === "/script.meta.js" ||
        url.pathname === "/hdjrzTools.user.js"
      )) {
        if (request.method === "HEAD") {
          return new Response(null, {
            headers: {
              "Content-Type": "text/javascript; charset=utf-8",
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
              "Pragma": "no-cache",
              "Expires": "0"
            }
          });
        }
        try {
          const sysConfig = await getSystemConfig(env);
          const channel = (url.searchParams.get("channel") || url.searchParams.get("role") || "").toLowerCase();
          const targetVer = (channel === "admin")
            ? (sysConfig.adminLatestVersion || sysConfig.latestVersion || "1.6.2")
            : (sysConfig.agentLatestVersion || sysConfig.latestVersion || "1.5.9");

          const headers = { "User-Agent": "Tampermonkey-Updater" };
          if (env.GITHUB_TOKEN) {
            headers["Authorization"] = `token ${env.GITHUB_TOKEN}`;
          }
          let targetFile = "hdjrzTools.user.js";
          if (url.pathname === "/bundle.js") {
            targetFile = "dist/bundle.js";
          } else if (url.pathname === "/loader.user.js") {
            targetFile = "hdjrzTools.loader.user.js";
          }

          let scriptText = null;
          // When fleet is held on an earlier staged version, attempt to fetch from Git release tag v<targetVer>
          if (targetVer && targetVer !== sysConfig.latestVersion) {
            try {
              const tagUrl = `https://raw.githubusercontent.com/hdjrz/hdjrz-tools/v${targetVer}/${targetFile}?ts=${Date.now()}`;
              const tagResp = await fetch(tagUrl, { headers });
              if (tagResp.ok) {
                scriptText = await tagResp.text();
              }
            } catch (e) {}
          }

          if (!scriptText) {
            const ghUrl = `https://raw.githubusercontent.com/hdjrz/hdjrz-tools/main/${targetFile}?ts=${Date.now()}`;
            const resp = await fetch(ghUrl, { headers });
            if (resp.ok) {
              scriptText = await resp.text();
            }
          }

          if (scriptText) {
            let responseBody = scriptText;

            if (url.pathname.endsWith(".meta.js")) {
              const metaMatch = scriptText.match(/\/\/\s*==UserScript==[\s\S]*?\/\/\s*==\/UserScript==/);
              if (metaMatch) responseBody = metaMatch[0] + "\n";
            }

            // Enforce target version in userscript header so Tampermonkey respects release channels
            if (targetVer && (url.pathname.endsWith(".meta.js") || url.pathname.endsWith(".user.js"))) {
              responseBody = responseBody.replace(/\/\/\s*@version\s+[^\r\n]+/i, `// @version      ${targetVer}`);
              if (channel === "admin") {
                responseBody = responseBody.replace(/(\/\/\s*@(updateURL|downloadURL)\s+https?:\/\/[^\r\n?]+)/g, "$1?channel=admin");
              } else {
                responseBody = responseBody.replace(/\?channel=admin/g, "");
              }
            }

            return new Response(responseBody, {
              headers: {
                "Content-Type": "text/javascript; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0"
              }
            });
          }
        } catch (e) {}
        return new Response("// Error fetching script from GitHub", { status: 500 });
      }

      // 4. Dispatch to Route Modules
      let response = null;

      // /api/auth/* and /admin/api/auth
      response = await handleAuthRoutes(request, env, url);
      if (response) return response;

      // /api/licenses/*, root POST /, and /admin/api/licenses/*
      response = await handleLicenseRoutes(request, env, url);
      if (response) return response;

      // /api/agents/* and /admin/api/active-users
      response = await handleAgentRoutes(request, env, url);
      if (response) return response;

      // /api/templates/* and /config/templates
      response = await handleTemplateRoutes(request, env, url);
      if (response) return response;

      // /api/escalations/*
      response = await handleEscalationRoutes(request, env, url);
      if (response) return response;

      // /api/audit/*
      response = await handleAuditRoutes(request, env, url);
      if (response) return response;

      // /api/system/* and /config/system
      response = await handleSystemRoutes(request, env, url);
      if (response) return response;

      // 5. Unmatched route
      return jsonError("not_found", `Route not found: ${request.method} ${url.pathname}`, 404);

    } catch (err) {
      if (err instanceof AppError) {
        return jsonError(err.code, err.message, err.statusCode);
      }
      console.error("[Worker Unhandled Error]:", err);
      return jsonError("server_error", err && err.message ? err.message : "Internal server error", 500);
    }
  }
};
