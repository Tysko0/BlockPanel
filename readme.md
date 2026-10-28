<div align="center">
    <h2>BlockPanel</h2>
    
    ```text
    Un outils Windows conçu pour simplifier l'installation, la configuration 
    et le démarrage d'un serveur minecraft localhost grâce à des scripts automatisée 
    en Batch et  JavaScript (Node.js). L'objectif est de propose une installation simple 
    et une organisation claire des fichier et une gestion centralisée.
    ```

    <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge" alt="Version 1.0.0">

    <a href="https://github.com/Tysko0/#/blob/main/LICENSE">
        <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="Licence MIT">
    </a>
</div>

## Technologie Utilisées

<img src="https://img.shields.io/badge/Node.js-Runtime-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js">
<img src="https://img.shields.io/badge/Batch-Windows%20Scripts-0078D6?style=flat&logo=windows&logoColor=white" alt="Batch">
<img src="https://img.shields.io/badge/MJS-ES%20Modules-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="MJS">

## Fonctionnalitées

- [x] Verification de la présence de Node.js
- [x] Gestion des erreurs au lancement
- [x] Détection automatique de la première installation
- [x] Installation et initialisation du serveur Minecraft
- [x] Démarrage direct du serveur après installation
- [x] Barres de progression dans le terminal
- [ ] Système de log avec horodatage
- [ ] Rotation automatique avec journaux volumineux

*Les fonctionnalitées cochées correspondent à ce qui est dèja mit en place et ceux qui ne sont pas cochée est ce qui est prevu dans la roadmap*

## Installation

### Prérequis

- <img src="https://img.shields.io/badge/Node.js-Runtime-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js">
- <img src="https://img.shields.io/badge/Java-Minecraft%20Server-ED8B00?style=flat&logo=openjdk&logoColor=white" alt="Java">

*La version de Java requise dépend de la version de Minecraft utilisée.*

### Cloner le dépôt

```bash
git clone https://github.com/Tysko0/#.git
cd BlockPanel
```

### Lancer BlockPanel

**Double Click sur le fichier `start.bat` ou exécute-le depuis un terminal Windows : **

```bash
start.bat
```

### Première Installation

*Lors d'une premier lancement, BlockPanel vérifie son environnement et démarre le processus d'installation.*
*Selon la configuration proposée, tu pourras notamment choisir les paramètre du serveur et accepeter l'EULA de minecraft*
*Une fois l'installation terminée, BlockPanel lance le serveur*

### Lancements suivants 

*Lorsque les fichiers d'installations sont présents, BlockPanel passe directement au démarrage du serveur minecraft avec ses paramètre*

## Structure du projet

```text
BlockPanel
├── start.bat
├── logs
├── scripts
│   ├── start.bat
│   └── mjs
│       ├── backend.mjs
│       └── setup.mjs
└── server
```

## Contribution

Les contributions, suggestions et rapports de bugs sont les bienvenus.

1. Fork le dépôt.
2. Crée une branche pour ta fonctionnalité.
3. Effectue tes modifications.
4. Ouvre une Pull Request en expliquant les changements.

## Licence

Ce projet est distribué sous licence MIT. Consulte le fichier `LICENSE` pour plus d'informations.

## Auteur

Développé par Tysko

---

<div align="center">
    *Développé avec passion pour simplifier la gestion des serveurs Minecraft.*
</div>