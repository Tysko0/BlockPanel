import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { CreateLogger } from "./logger.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const server_dir = path.join(root, "server", "current");
const config_path = path.join(server_dir, "blockpanel.json");
const jar_path = path.join(server_dir, "server.jar");
const eula_path = path.join(server_dir, "eula.txt");

const logger = CreateLogger("backend");

function Fail(message, error = null) {
    if (error) {
        logger.exception(error, message);
    } else {
        logger.error(message);
    }

    process.exit(1);
}

function ReadConfig() {
    if (!fs.existsSync(config_path)) { Fail("Installation absente : blockpanel.json introuvable."); }
    if (!fs.existsSync(jar_path)) { Fail("Installation absente : server.jar introuvable."); }

    let config;

    try { config = JSON.parse(fs.readFileSync(config_path, "utf8")); } 
    catch (error) { Fail("Impossible de lire blockpanel.json.", error); }

    if (!config || typeof config !== "object" || Array.isArray(config)) { Fail("Le fichier blockpanel.json contient une configuration invalide."); }
    if (config.setupComplete !== true) { Fail("L'installation du serveur n'est pas terminée."); }
    if (config.eulaAccepted !== true) { Fail("L'EULA n'a pas été acceptée dans la configuration."); }
    if (!fs.existsSync(eula_path)) { Fail("Le fichier eula.txt est introuvable."); }

    const eula = fs.readFileSync(eula_path, "utf8");

    if (!/^eula\s*=\s*true\s*$/im.test(eula)) { Fail("Le fichier eula.txt ne confirme pas l'acceptation de l'EULA."); }
    if (!Number.isInteger(config.ram) || config.ram < 1 || config.ram > 32) { Fail("La valeur de RAM doit être comprise entre 1 et 32 Go."); }
    if (
        typeof config.name !== "string" ||
        !config.name.trim() ||
        typeof config.version !== "string" ||
        !/^\d+\.\d+(?:\.\d+)?$/.test(config.version)
    ) { Fail("Le nom ou la version du serveur est invalide."); }

    return config;
}

function CheckJava() {
    logger.info("Vérification de Java.");

    const result = spawnSync("java", ["-version"], { encoding: "utf8", windowsHide: true });

    if (result.error || result.status !== 0) { Fail("Java est introuvable ou ne peut pas être exécuté.", result.error); }

    const output = `${result.stdout || ""}\n${result.stderr || ""}`;
    const match = output.match(/version\s+"?(\d+)(?:[._-]|\s|")/i);

    if (match) { logger.success(`Java détecté : version ${match[1]}.`); } 
    else { logger.success("Java est disponible."); }
}

function StartMinecraft(config) {
    logger.info(`Préparation du serveur : ${config.name}.`);
    logger.info(`Version Minecraft : ${config.version}.`);
    logger.info(`RAM maximale : ${config.ram} Go.`);
    logger.info("Démarrage du processus Minecraft.");

    console.log("");
    console.log("========================================");
    console.log("       BLOCKPANEL - MINECRAFT");
    console.log("========================================");
    console.log(`Serveur : ${config.name}`);
    console.log(`Version : ${config.version}`);
    console.log(`RAM maximale : ${config.ram} Go`);
    console.log("");
    console.log("Démarrage de Minecraft...");
    console.log("");

    const minecraft = spawn("java", [ "-Xms1G", `-Xmx${config.ram}G`, "-jar", "server.jar", "nogui" ],
        {
            cwd: server_dir,
            windowsHide: false,
            stdio: "inherit"
        }
    );

    let spawnError = false;

    minecraft.on("error", error => {
        spawnError = true;
        logger.exception(error, "Impossible de lancer Minecraft");
        process.exitCode = 1;
    });

    minecraft.on("close", (code, signal) => {
        if (spawnError) {
            return;
        }

        if (code === 0) {
            logger.success("Minecraft s'est arrêté normalement.");
        } else {
            logger.error(`Minecraft s'est arrêté anormalement. Code : ${code ?? "inconnu"}, signal : ${signal ?? "aucun"}.`);
        }

        console.log("");
        console.log("========================================");
        console.log("       MINECRAFT EST ARRÊTÉ");
        console.log("========================================");

        process.exitCode = code === 0 ? 0 : 1;
    });
}

function Main() {
    logger.info("Démarrage du backend BlockPanel.");

    const config = ReadConfig();
    logger.success("Configuration du serveur validée.");

    CheckJava();
    StartMinecraft(config);
}

try {
    Main();
} catch (error) {
    Fail("Erreur inattendue dans le backend.", error);
}