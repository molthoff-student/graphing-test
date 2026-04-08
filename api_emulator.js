// @ts-nocheck
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";
const app = express();

async function serverBoot() {
    let vite;

    console.log("Booting server...");

    // --- Fake API route ---
    app.get("/api-emulator/*graphIdentity", (req, res) => {
        const { graphIdentity } = req.params;
        console.log(`Api emulator recieved: '${graphIdentity}'`);
        return res.json({
            name: graphIdentity,
            time: new Date(),
        });
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

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`App running on http://localhost:${port}`));
}

serverBoot();