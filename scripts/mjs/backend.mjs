import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../.."
);

const SERVER_DIR = path.join(ROOT, "server", "current");
const CONFIG_PATH = path.join(SERVER_DIR, "blockpanel.json");
const JAR_PATH = path.join(SERVER_DIR, "server.jar");

function fail(message) {
    console.error(`\n[ERREUR] ${message}`);
    process.exit(1);
}

console.clear();

console.log("========================================");
console.log("       BLOCKPANEL - MINECRAFT");
console.log("========================================\n");

if (!fs.existsSync(CONFIG_PATH) || !fs.existsSync(JAR_PATH)) {
    fail("Installation absente. Lance start.bat pour initialiser le serveur.");
}

let config;

try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
} catch {
    fail("Le fichier blockpanel.json est invalide.");
}

if (!config.setupComplete || !config.eulaAccepted) {
    fail("Configuration incomplète ou EULA non acceptée.");
}

if (!Number.isInteger(config.ram) || config.ram < 1 || config.ram > 32) {
    fail("La valeur de RAM dans blockpanel.json est invalide.");
}

const javaCheck = spawnSync("java", ["-version"], {
    encoding: "utf8",
    windowsHide: true
});

if (javaCheck.error || javaCheck.status !== 0) {
    fail("Java est introuvable. Installe une version compatible avec Minecraft.");
}

console.log(`Serveur : ${config.name}`);
console.log(`Type : ${config.type}`);
console.log(`Version : ${config.version}`);
console.log(`RAM maximale : ${config.ram} Go`);
console.log("\nDémarrage de Minecraft...\n");

const minecraft = spawn(
    "java",
    [
        `-Xms1G`,
        `-Xmx${config.ram}G`,
        "-jar",
        "server.jar",
        "nogui"
    ],
    {
        cwd: SERVER_DIR,
        windowsHide: false,
        stdio: "inherit"
    }
);

minecraft.on("error", error => {
    console.error(`\nImpossible de lancer Minecraft : ${error.message}`);
    process.exitCode = 1;
});

minecraft.on("close", (code, signal) => {
    console.log("\n========================================");
    console.log("       MINECRAFT EST ARRETE");
    console.log("========================================");
    console.log(`Code de sortie : ${code ?? signal ?? "inconnu"}`);
    process.exitCode = code === 0 ? 0 : 1;
});