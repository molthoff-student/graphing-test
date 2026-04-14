// @ts-nocheck
import fs from "fs";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import { pathToFileURL } from "url";

const isDev = process.env.NODE_ENV !== "production";
const app = express();

function watchApi(dir, onReload) {
    fs.watch(dir, { recursive: true }, async (eventType, filename) => {
        console.log(`API changed: ${filename}`);
        try {
            const apiTokens = await loadApiToken(dir);
            onReload(apiTokens);
        } catch (err) {
            console.error("Reload failed:", err);
        }
    });
}

// Load all emulated Api handlers from a directory.
async function loadApiToken(dir) {
    console.log(`Initializing Api's from '${dir}'`);
    const files = fs.readdirSync(dir);

    const map = {};

    for (const file of files) {
        console.log(`Creating Api token from '${file}'`);
        const fullPath = path.join(dir, file);

        const module = await import(
            pathToFileURL(fullPath)
        );

        // Strip file extension
        const apiToken = path.basename(file, ".js");
        map[apiToken] = module.default;
    }

    return map;
}

// Allow Vite-like hot reloading.
const apiTokens = "./api_tokens";
let apiHandlers = await loadApiToken(apiTokens);
watchApi(apiTokens, (newHandlers) => {
    apiHandlers = newHandlers;
});

async function serverBoot() {
    let vite;

    console.log("Booting server...");

    // Initialize emulated api.
    app.get("/api-emulator/*apiToken", (req, res) => {
        const { apiToken } = req.params;
        //console.log(`Api token: '${apiToken}'.`);

        let callback = apiHandlers[apiToken];
        if (callback) {
            let data = callback();
            return res.json(data);
        } else {
            throw new Error("Invalid Api token.");
        }
    });

    if (isDev) {
        console.log("Starting Vite dev server...");
        vite = await createViteServer({
            server: { middlewareMode: "ssr" },
            root: process.cwd(),
        });

        app.use(vite.middlewares);
        console.log("Vite middleware applied.");
    } else {
        app.use(express.static(path.resolve("dist")));
        console.log("Serving React build from dist...");
    }

    app.get("/*path", async (req, res) => {
        if (isDev && vite) {
            const template = await vite.transformIndexHtml(
                req.originalUrl,
                "<!-- index.html -->"
            );
            res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } else {
            res.sendFile(path.resolve("dist/index.html"));
        }
    });

    // Set up local host.
    const port = process.env.PORT || 6767;
    let log = `App running on http://localhost:${port}`;
    app.listen(port, () => console.log(log));
}

serverBoot();