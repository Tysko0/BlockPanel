import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { CreateLogger } from "./logger.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const server_dir = path.join(root, "server", "current");
const config_path = path.join(server_dir, "blockpanel.json");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const logger = CreateLogger("setup");

function Question(message) {
    return new Promise(resolve => { rl.question(message, answer => resolve(answer.trim())); });
}

async function FetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) { throw new Error(`Erreur HTTP ${response.status}`); }

    logger.info(`Requête API réussie : ${url}`);

    return response.json();
}

async function Download(url, destination, expectedSha1 = null) {
    logger.info(`Début du téléchargement : ${url}`);

    const response = await fetch(url);

    if (!response.ok) { throw new Error(`Téléchargement impossible : HTTP ${response.status}`); }

    logger.success("Réponse HTTP reçue.");

    const buffer = Buffer.from(await response.arrayBuffer());

    if (expectedSha1) {
        const sha1 = crypto.createHash("sha1").update(buffer).digest("hex");

        if (sha1 !== expectedSha1) { throw new Error("La vérification SHA-1 a échoué."); }
    }

    logger.success("Vérification SHA-1 réussie.");

    const temporary = `${destination}.tmp`;

    fs.writeFileSync(temporary, buffer);
    fs.renameSync(temporary, destination);

    logger.success(`Téléchargement terminé : ${(buffer.length / 1024 / 1024).toFixed(1)} Mo`);
}

async function InstallVanilla(version, destination) {
    const manifest = await FetchJson("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json");
    const entry = manifest.versions.find(item => item.id === version);

    if (!entry) { throw new Error(`Version Vanilla introuvable : ${version}`); }

    const metadata = await FetchJson(entry.url);
    const downloadInfo = metadata.downloads?.server;

    if (!downloadInfo?.url) { throw new Error("JAR officiel indisponible pour cette version."); }

    logger.info(`Installation Vanilla : ${version}`);

    await Download(downloadInfo.url, destination, downloadInfo.sha1);
}

async function main() {
    logger.info("Démarrage du processus d'installation.");

    fs.mkdirSync(server_dir, { recursive: true });

    const name = (await Question("Nom du serveur : ")) || "Mon serveur Minecraft";
    logger.info(`Nom du serveur configuré : ${name}`);

    const version = await Question("Version Minecraft (ex. 1.21.8) : ");

    if (!/^\d+\.\d+(?:\.\d+)?$/.test(version)) { throw new Error("Format de version invalide."); }

    logger.info(`Version Minecraft sélectionnée : ${version}`);

    const ramInput = await Question("RAM maximale en Go (défaut 2) : ");
    const ram = ramInput ? Number(ramInput) : 2;

    if (!Number.isInteger(ram) || ram < 1 || ram > 32) { throw new Error("La RAM doit être comprise entre 1 et 32 Go."); }

    logger.info(`RAM maximale configurée : ${ram} Go`);

    console.log("\nAvant de continuer, consulte l'EULA de Minecraft :");
    console.log("https://www.minecraft.net/eula");

    const accepted = (await Question("\nAs-tu lu et accepté l'EULA ? (oui/non) : ")).toLowerCase();

    if (!["oui", "o"].includes(accepted)) { throw new Error("Installation annulée : EULA non acceptée."); }

    logger.success("EULA acceptée par l'utilisateur.");

    const jar = path.join(server_dir, "server.jar");
    const temporaryJar = path.join(server_dir, "server.jar.tmp");

    fs.rmSync(config_path, { force: true });
    fs.rmSync(temporaryJar, { force: true });

    console.log(`\nInstallation de Vanilla ${version}...`);
    console.log("Cette opération peut prendre quelques minutes.");

    await InstallVanilla(version, temporaryJar);

    fs.renameSync(temporaryJar, jar);

    const safeName = name.replace(/[\r\n]/g, " ").slice(0, 50);

    fs.writeFileSync(path.join(server_dir, "eula.txt"), "eula=true\n", "utf8");

    fs.writeFileSync(
        path.join(server_dir, "server.properties"), [
            `motd=${safeName}`,
            "server-port=25565",
            "online-mode=true",
            "max-players=20",
            "difficulty=normal",
            "gamemode=survival",
            "white-list=false",
            ""
        ].join("\n"), "utf8"
    );

    const config = {
        name: safeName,
        version,
        ram,
        eulaAccepted: true,
        setupComplete: true,
        installedAt: new Date().toISOString()
    };

    fs.writeFileSync(config_path, JSON.stringify(config, null, 2), "utf8");

    logger.success("Configuration blockpanel.json créée.");
    logger.success(`Installation terminée pour ${safeName}.`);
}

main()
    .catch(error => {
        logger.exception(error, "Échec de l'installation");
        process.exitCode = 1;
    })
    .finally(() => {
        rl.close();
    });