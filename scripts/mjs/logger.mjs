import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const log_dir = path.join(root, "logs");

const max_size = 5 * 1024 * 1024;
const max_backup = 3;

fs.mkdirSync(log_dir, { recursive: true });

function Rotate(file) {
    if (!fs.existsSync(file) || fs.statSync(file).size < max_size) return;

    for (let i = max_backup; i >= 1; i--) {
        const source = i === 1 ? file : `${file}.${i - 1}`;
        const dest = `${file}.${i}`;
        
        if (i === max_backup && fs.existsSync(dest)) {
            fs.rmSync(dest, { force: true });
        }

        if (fs.existsSync(source)) {
            fs.renameSync(source, dest);
        }
    }
}

function Timestamp() {
    return new Date().toISOString();
}

function Write(name, level, msg) {
    const file = path.join(log_dir, `${name}.log`);
    const text = `[${Timestamp()}] [${level}] ${String(msg)}\n`;

    try {
        Rotate(file);
        fs.appendFileSync(file, text, "utf8");
    } catch (err) {
        process.stderr.write(`Impossible d'ecrire le log : ${error.message}\n`);
    }
}

export function CreateLogger(name = "blockpanel") {
    const filename = String(name).replace(/[^a-zA-Z0-9_-]/g, "_");

    function Log(level, msg) {
        const text = `[${Timestamp()}] [${level}] ${String(msg)}`;

        Write(filename, level, msg);

        if (level === "ERROR") {
            console.error(text);
        } else if (level === "WARN") {
            console.warn(text);
        } else {
            console.log(text);
        }
    }

    return {
        info: (msg) => Log("INFO", msg),
        success: (msg) => Log("SUCCESS", msg),
        warn: (msg) => Log("WARN", msg),
        error: (msg) => Log("ERROR", msg),
        exception: (error, msg = "Une erreur est survenue") => {
            const details = error instanceof Error
                ? `${msg}: ${error.stack || error.message}`
                : `${msg}: ${String(error)}`;

            Log("ERROR", details)
        }
    };
}

export function GetLogDirectory() {
    return log_dir;
}