import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

function presetsApi(): Plugin {
  const presetsDir = path.resolve(__dirname, "presets");

  function ensureDir() {
    if (!fs.existsSync(presetsDir)) fs.mkdirSync(presetsDir);
  }

  return {
    name: "presets-api",
    configureServer(server) {
      server.middlewares.use("/api/presets", (req, res) => {
        ensureDir();

        // LIST: GET /api/presets
        if (req.method === "GET" && (req.url === "/" || !req.url || req.url === "")) {
          const files = fs
            .readdirSync(presetsDir)
            .filter((f) => f.endsWith(".json"))
            .map((f) => f.replace(/\.json$/, ""))
            .sort();
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(files));
          return;
        }

        const name = decodeURIComponent(
          (req.url || "").replace(/^\//, "").replace(/\.json$/, ""),
        );
        if (!name || name.includes("/") || name.includes("..")) {
          res.statusCode = 400;
          res.end("Invalid preset name");
          return;
        }
        const filePath = path.join(presetsDir, `${name}.json`);

        // READ: GET /api/presets/:name
        if (req.method === "GET") {
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }
          res.setHeader("Content-Type", "application/json");
          res.end(fs.readFileSync(filePath, "utf-8"));
          return;
        }

        // SAVE / UPDATE: PUT /api/presets/:name
        if (req.method === "PUT") {
          let body = "";
          req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
          req.on("end", () => {
            fs.writeFileSync(filePath, body, "utf-8");
            res.statusCode = 200;
            res.end("OK");
          });
          return;
        }

        // DELETE: DELETE /api/presets/:name
        if (req.method === "DELETE") {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          res.statusCode = 200;
          res.end("OK");
          return;
        }

        res.statusCode = 405;
        res.end("Method not allowed");
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), presetsApi()],
});
