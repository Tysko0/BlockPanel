import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../.."
);

const SERVER_DIR = path.join(ROOT, "server", "current");
const CONFIG_PATH = path.join(SERVER_DIR, "blockpanel.json");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(message) {
    return new Promise(resolve => {
        rl.question(message, answer => resolve(answer.trim()));
    });
}

async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
    }

    return response.json();
}

async function download(url, destination, expectedSha1 = null) {
    console.log("\nTéléchargement en cours...");

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Téléchargement impossible : HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (expectedSha1) {
        const sha1 = crypto.createHash("sha1").update(buffer).digest("hex");

        if (sha1 !== expectedSha1) {
            throw new Error("La vérification SHA-1 a échoué.");
        }
    }

    const temporary = `${destination}.tmp`;
    fs.writeFileSync(temporary, buffer);
    fs.renameSync(temporary, destination);

    console.log(`Téléchargement terminé : ${(buffer.length / 1024 / 1024).toFixed(1)} Mo`);
}

async function installVanilla(version, destination) {
    const manifest = await fetchJson(
        "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
    );

    const entry = manifest.versions.find(item => item.id === version);

    if (!entry) {
        throw new Error(`Version Vanilla introuvable : ${version}`);
    }

    const metadata = await fetchJson(entry.url);
    const downloadInfo = metadata.downloads?.server;

    if (!downloadInfo?.url) {
        throw new Error("JAR officiel indisponible pour cette version.");
    }

    await download(downloadInfo.url, destination, downloadInfo.sha1);
}

async function installPaper(version, destination) {
    const result = await fetchJson(
        `https://api.papermc.io/v2/projects/paper/versions/${encodeURIComponent(version)}`
    );

    if (!result.builds?.length) {
        throw new Error(`Aucun build Paper pour Minecraft ${version}.`);
    }

    const build = Math.max(...result.builds);
    const url =
        `https://api.papermc.io/v2/projects/paper/versions/${encodeURIComponent(version)}` +
        `/builds/${build}/downloads/paper-${version}-${build}.jar`;

    await download(url, destination);
}

async function installFabric(version, destination) {
    const loaders = await fetchJson(
        `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(version)}`
    );

    const installers = await fetchJson(
        "https://meta.fabricmc.net/v2/versions/installer"
    );

    if (!loaders.length || !installers.length) {
        throw new Error("Aucune version de Fabric disponible.");
    }

    const loader = loaders[0].loader.version;
    const installer = installers[0].version;

    const url =
        `https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(version)}` +
        `/${encodeURIComponent(loader)}/${encodeURIComponent(installer)}/server/jar`;

    await download(url, destination);
}

async function main() {
    console.log("========================================");
    console.log("      BLOCKPANEL - PREMIER DEMARRAGE");
    console.log("========================================\n");

    fs.mkdirSync(SERVER_DIR, { recursive: true });

    const name = (await question("Nom du serveur : ")) || "Mon serveur Minecraft";

    console.log("\nType de serveur :");
    console.log("1. Vanilla");
    console.log("2. Paper");
    console.log("3. Fabric");

    const choice = await question("\nChoix (1-3) : ");

    const types = {
        "1": "vanilla",
        "2": "paper",
        "3": "fabric"
    };

    const type = types[choice];

    if (!type) {
        throw new Error("Type de serveur invalide.");
    }

    const version = await question("Version Minecraft (ex. 1.21.8) : ");

    if (!/^\d+\.\d+(?:\.\d+)?$/.test(version)) {
        throw new Error("Format de version invalide.");
    }

    const ramInput = await question("RAM maximale en Go (défaut 2) : ");
    const ram = ramInput ? Number(ramInput) : 2;

    if (!Number.isInteger(ram) || ram < 1 || ram > 32) {
        throw new Error("La RAM doit être comprise entre 1 et 32 Go.");
    }

    console.log("\nAvant de continuer, consulte l'EULA de Minecraft :");
    console.log("https://www.minecraft.net/eula");

    const accepted = (
        await question("\nAs-tu lu et accepté l'EULA ? (oui/non) : ")
    ).toLowerCase();

    if (!["oui", "o"].includes(accepted)) {
        throw new Error("Installation annulée : EULA non acceptée.");
    }

    const jar = path.join(SERVER_DIR, "server.jar");
    const temporaryJar = path.join(SERVER_DIR, "server.jar.tmp");

    fs.rmSync(CONFIG_PATH, { force: true });
    fs.rmSync(temporaryJar, { force: true });

    console.log(`\nInstallation de ${type} ${version}...`);
    console.log("Cette opération peut prendre quelques minutes.");

    if (type === "vanilla") {
        await installVanilla(version, temporaryJar);
    } else if (type === "paper") {
        await installPaper(version, temporaryJar);
    } else {
        await installFabric(version, temporaryJar);
    }

    fs.renameSync(temporaryJar, jar);

    const safeName = name.replace(/[\r\n]/g, " ").slice(0, 50);

    fs.writeFileSync(
        path.join(SERVER_DIR, "eula.txt"),
        "eula=true\n",
        "utf8"
    );

    fs.writeFileSync(
        path.join(SERVER_DIR, "server.properties"), [
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
        type,
        version,
        ram,
        eulaAccepted: true,
        setupComplete: true,
        installedAt: new Date().toISOString()
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");

    console.log("\n========================================");
    console.log("     INSTALLATION TERMINEE");
    console.log("========================================");
    console.log(`Serveur : ${safeName}`);
    console.log(`Type : ${type}`);
    console.log(`Version : ${version}`);
    console.log(`RAM : ${ram} Go`);
    console.log("\nBlockPanel va maintenant lancer Minecraft.");
}

main()
    .catch(error => {
        console.error(`\n[ERREUR] ${error.message}`);
        process.exitCode = 1;
    })
    .finally(() => {
        rl.close();
    });