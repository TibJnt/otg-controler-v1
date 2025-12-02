## 1. Objectif de l’outil

Un **petit outil local** qui :

1. Contrôle un ou plusieurs iPhones via **iMouseXP** (scroll, tap).
2. Prend des **screenshots** de ton app (ton faux TikTok).
3. Envoie le screenshot à **OpenAI Vision** pour savoir ce qu’il y a dans la vidéo.
4. Applique des **règles simples** (“si la vidéo contient *dance* → Like”, etc.).
5. Exécute les actions (Like, Comment, Save) avec des clics aux coordonnées configurées.

Tout ça :

* tourne sur **ta machine Windows** où iMouseXP est installé ;
* utilise **des fichiers JSON locaux** pour garder la config (pas de vraie base de données) ;
* est utilisé par **toi uniquement**.

---

## 2. Contraintes & non-objectifs

* ✅ **Local only** : pas de cloud, pas de multi-user.
* ✅ **Pas de base de données** : juste des fichiers `.json` sur disque.
* ✅ **Une seule automation active à la fois** (un bouton Start/Stop).
* ✅ **Interface très simple** (ton écran actuel : Select devices, Automation settings, Automation actions…).
* ❌ Pas de gestion d’utilisateurs, de droits, etc.
* ❌ Pas de scheduler complexe (pas de “lancer demain à 3h du matin”, seulement bouton Start/Stop).
* ❌ Pas de monitoring avancé, seulement un log texte/console basique.

---

## 3. Vue d’ensemble du système

### 3.1. Composants

1. **iMouseXP (existant)**

   * Logiciel Windows qui expose une API locale.
   * Capable de :

     * **lister les devices** connectés,
     * **cliquer** à des coordonnées,
     * **swipe** pour scroller,
     * **prendre un screenshot**.

2. **Contrôleur d’automation (process “backend”)**

   * Petit programme local qui :

     * appelle l’API d’iMouseXP,
     * envoie les screenshots à l’API OpenAI Vision,
     * applique les règles d’automation,
     * expose une **mini API HTTP locale** pour ton frontend (ou lit ses fichiers JSON directement).

3. **Fichiers de configuration (.json)**

   * `devices.json` : infos sur tes devices + coordonnées.
   * `automation.json` : paramètres de l’automation (intervals, triggers, devices sélectionnés).

4. **Frontend (ton UI)**

   * Page unique avec les sections :

     * “Select devices”
     * “Device action coordinates”
     * “Automation settings”
     * “Automation actions”
     * Bouton “Start Automation / Stop Automation”
   * Lit/écrit `automation.json` (via une petite API locale ou directement) et déclenche Start/Stop.

---

## 4. Données (en mémoire + fichiers JSON)

*(C’est de la **forme**, pas du code à coller :)*

### 4.1. Fichier `devices.json`

But : savoir quels devices tu as, comment tu les appelles, et où sont les boutons.

Pour chaque device :

* `idImouse` : identifiant renvoyé par iMouseXP.
* `label` : nom lisible (ex. “iPhone 13 – gauche”).
* `coords` :

  * `like` : `{ xNorm, yNorm }` (coordonnées normalisées entre 0 et 1).
  * `comment`: `{ xNorm, yNorm }`
  * `save` : `{ xNorm, yNorm }`
* (optionnel plus tard) `commentSendButton`, `commentInputField` si tu veux gérer le bouton “Envoyer” précisément.

**Principe important** :
On stocke **des coordonnées normalisées** (0–1).
Au runtime, le contrôleur :

1. prend un screenshot,
2. lit sa résolution (ex. 1170 × 2532),
3. calcule `x = xNorm * largeur`, `y = yNorm * hauteur`,
4. envoie ces (x, y) à iMouseXP pour cliquer.

Ça évite de refaire toute la calibration si la résolution change ou si tu clones un device.

---

### 4.2. Fichier `automation.json`

Une seule automation pour l’instant (simple) :

* `name` : nom lisible, ex. `"Dancing Videos"`.
* `deviceIds` : liste d’`idImouse` des devices sur lesquels tu veux exécuter le scénario.
* `postIntervalSeconds` : délai entre deux **actions** (like/comment/save) sur un même device.
* `scrollDelaySeconds` : délai **entre scroll et analyse** (le temps que la vidéo se charge).
* `triggers` : liste des triggers (règles).
* `running` : booléen ou status (`"stopped" | "running"`), mis à jour par Start/Stop.

### 4.3. Structure d’un trigger

Un trigger correspond à :

> *“Si la vidéo contient X ou Y → faire Like / Comment / Save”*

Pour chaque trigger :

* `action` : `"LIKE"` | `"COMMENT"` | `"SAVE"` | `"LIKE_AND_COMMENT"` | `"SKIP"`.
* `keywords` : liste de mots ou phrases à chercher dans l’analyse vision.

  * ce qui correspond au champ “Video Contains” de ton UI (on split par virgule).
* `deviceIds` (optionnel) : si tu veux que ce trigger ne s’applique qu’à certains devices ; sinon il s’applique à tous ceux de `automation.deviceIds`.
* (optionnel pour COMMENT) :

  * `commentTemplates` : liste de phrases possibles.
  * `commentLanguage` : `"fr"` / `"en"` pour guider OpenAI si tu génères le texte.

---

## 5. Fonctionnement côté utilisateur (flows)

### 5.1. Flow 1 – Découverte des devices (“Select devices”)

1. Tu cliques sur “Refresh devices”.
2. Le contrôleur appelle iMouseXP pour récupérer la liste des devices connectés.
3. Il met à jour `devices.json` (ajoute ceux qui manquent, éventuellement garde l’alias `label` si déjà connu).
4. Le frontend affiche :

   * “All Devices (N)” avec N = nombre de devices,
   * une liste avec checkboxes pour sélectionner lesquels participeront à l’automation.

Résultat attendu : tu coches 1–2–3 devices qui seront utilisés par l’automation.

---

### 5.2. Flow 2 – Calibration des coordonnées (“Device action coordinates”)

Objectif : dire à l’outil “ici c’est Like, ici c’est Comment, ici c’est Save”.

Pour chaque device sélectionné :

1. Tu cliques sur “Calibrer” (par exemple).
2. Le contrôleur :

   * demande un screenshot du device à iMouseXP,
   * le renvoie au frontend,
   * le frontend affiche le screenshot dans un canvas.
3. Sur l’UI, tu cliques avec la souris sur le bouton “Like” de l’app :

   * le frontend récupère les coordonnées `(x, y)` dans l’image,
   * il calcule `xNorm = x / largeur`, `yNorm = y / hauteur`,
   * il écrit ça dans `devices.json` → `coords.like`.
4. Tu recommences pour “Comment” et “Save”.

**MVP** :
Même si tu ne fais pas d’UI “canvas”, tu peux aussi :

* afficher le screenshot avec un outil externe,
* noter les coordonnées à la main dans les inputs “X/Y” du frontend,
* le frontend les normalise et les sauvegarde.

---

### 5.3. Flow 3 – Configuration de l’automation (“Automation settings”)

Tu remplis dans ton UI :

* **Automation name** : champ texte → `automation.name`.
* **Set the post interval for interaction** :

  * spinner ou champ numérique → `automation.postIntervalSeconds`.
* **Set the scroll delay for interaction** :

  * spinner ou champ numérique → `automation.scrollDelaySeconds`.
* Les devices sélectionnés dans “Select devices” sont sauvegardés dans `automation.deviceIds`.

Le frontend met à jour `automation.json`.

---

### 5.4. Flow 4 – Création des triggers (“Automation actions”)

Dans la partie “Automation actions” :

1. **Action** : dropdown (“Like”, “Comment”, “Save”…).
2. **Trigger Conditions** :

   * champ “Video Contains” (texte libre, ex. `"dance, dancing, girl"`),
   * on transforme ça en `keywords = ["dance", "dancing", "girl"]`.
3. **Assign to Devices** :

   * multi-select,
   * si tu ne choisis rien → le trigger s’applique à tous les devices de `automation.deviceIds`.

Quand tu cliques sur “Create Trigger” :

* le frontend ajoute une entrée dans `automation.triggers` et réécrit `automation.json`.

Pour MVP, un **seul type de condition** :

> “Video Contains” → on check si **au moins un** des keywords apparaît dans l’analyse Vision.

---

### 5.5. Flow 5 – Lancer & arrêter l’automation

* Bouton **“Start Automation”** :

  1. envoie une commande au contrôleur (par ex. `POST /start`),
  2. le contrôleur met `automation.running = true` et lance la boucle.

* Bouton **“Stop Automation”** :

  1. envoie une commande `POST /stop`,
  2. le contrôleur met `automation.running = false` et stoppe toutes les boucles.

Tu peux aussi prévoir un **bouton “Emergency Stop”** qui force `running = false` tout de suite même en cas de bug.

---

## 6. Comportement runtime (boucle d’automation)

### 6.1. Boucle globale

Une fois `Start` cliqué et `automation.running = true` :

* Le contrôleur charge `devices.json` + `automation.json`.
* Il construit la liste `devicesActifs = intersection(automation.deviceIds, devices connus)`.

MVP : **une seule boucle** qui tourne, et à chaque “tick” parcourt tous les devices actifs.

Schéma :

1. Tant que `running = true` :

   * pour chaque device actif :

     1. Exécuter un “cycle” (scroll → analyse → action).
   * recommencer.

Ça évite d’avoir de la vraie concurrence (threads) et reste simple.

---

### 6.2. Cycle pour un device

Pour un device donné (un passage dans la boucle) :

1. **Scroll vers la prochaine vidéo**

   * envoyer à iMouseXP un swipe vertical (direction “up” ou “down” fixe pour tous les devices).
2. **Attendre** `scrollDelaySeconds` (avec un peu de random, ex. ±20 %).
3. **Prendre un screenshot**

   * demander à iMouseXP un screenshot pour ce device.
4. **Analyse Vision**

   * envoyer le screenshot à OpenAI Vision,
   * obtenir une réponse structurée avec :

     * une courte description,
     * une liste de mots-clés / tags.
5. **Évaluation des triggers**

   * construire une string `texteAnalyse` avec description + tags.
   * pour chaque trigger applicable à ce device :

     * vérifier si **au moins un** `keyword` est présent (case-insensitive) dans `texteAnalyse`.
   * si plusieurs triggers matchent :

     * MVP : prendre le **premier** dans la liste.
   * si aucun ne matche :

     * action = aucune (juste scroll).
6. **Exécuter l’action**

   * `LIKE` :

     * calculer (x, y) à partir des `coords.like` du device,
     * envoyer un clic à ces coordonnées.
   * `COMMENT` (MVP simple) :

     * clic sur `coords.comment` pour ouvrir la zone de commentaires,
     * insérer un texte simple (ex. choisi au hasard dans `commentTemplates` ou une phrase fixe),
     * clic sur une coordonnée “Envoyer” (optionnel dans la v1 si tu ne veux pas te prendre la tête).
   * `SAVE` :

     * idem que Like avec `coords.save`.
7. **Attendre** `postIntervalSeconds` (± un peu de random), puis passer au device suivant.

Ré-exécuté en boucle tant que l’automation est en cours.

---

## 7. “Humanisation” minimale

Sans overengineering, juste 2–3 trucs :

* Ajouter une **variation aléatoire** sur les délais :

  * `scrollDelaySeconds` × (entre 0.8 et 1.2),
  * `postIntervalSeconds` × (entre 0.7 et 1.3).
* Ne pas toujours liker :

  * même si un trigger matche, tu peux définir dans la spec :

    * `probability` pour chaque action (ex. 0.8 de like, 0.2 de ne rien faire).
* Parfois juste scroller sans action :

  * ex. 1 cycle sur 3 tu ignore volontairement les triggers (même si ça matche).

Tout ça reste dans la logique, pas besoin de système compliqué.

---

## 8. Gestion des erreurs (simple)

Spécifier un comportement ultra basique :

* **Pas de device** :

  * si `devicesActifs` est vide au moment de Start :

    * refuser de démarrer avec un message “No devices available”.
* **Coords manquantes** :

  * au lancement, vérifier que chaque device a des `coords.like` (et autres si utilisés),
  * sinon, log “Missing coordinates for device X, skipping”.
* **Échec screenshot** :

  * log l’erreur,
  * sauter ce cycle pour ce device.
* **Erreur API Vision** :

  * log l’erreur,
  * ne faire aucune action sur ce cycle (juste continuer à scroller sur les suivants).
* **Stop demandé** :

  * dès que `running` passe à false, le contrôleur termine la boucle en cours et ne réenclenche plus de cycle.

---

## 9. Logging minimal

Comme c’est un outil perso :

* Affichage console du type :

  * `[10:32:01] Device iPhone 13: scroll → description="girl dancing", action=LIKE`
  * `[10:32:10] Device iPhone 13: no trigger matched`
* Optionnel : un fichier `automation.log` pour rejouer ce qui s’est passé.

---

## 10. Plan d’implémentation simple (sans code)

1. **Implémenter un petit client iMouseXP**

   * Fonctions : lister devices, swipe, click, screenshot.
2. **Gérer les fichiers `devices.json` et `automation.json`**

   * Lecture/écriture simple, sans ORM, sans DB.
3. **Brancher ton UI**

   * Boutons “Refresh devices”, “Save coordinates”, “Create trigger”, “Start/Stop”.
4. **Faire tourner un premier scénario**

   * 1 device, 1 trigger (“Video Contains: dance”), action = LIKE.
5. **Ajouter petit à petit**

   * Commentaires,
   * Plusieurs devices,
   * Humanisation.

---

Parfait, on garde tout ce que tu as déjà, et on rajoute à la fin une section **“Documentation”** que tu peux coller telle quelle dans ton doc de specs.

---

## 11. Documentation

### 11.1. Vue d’ensemble

Ton outil s’appuie sur deux blocs de doc principaux :

1. **Some3C / iMouseXP** – pour tout ce qui est :

   * découverte des devices,
   * clics / swipes,
   * screenshots.
2. **OpenAI API** – pour :

   * l’analyse Vision des screenshots,
   * éventuellement la génération de texte (commentaires).

L’idée : à chaque étape de la spec (Lister devices, Scroll, Screenshot, Analyse, Action), tu sais **exactement** dans quelle page de doc aller.

---

### 11.2. Documentation iMouseXP / Some3C

#### 11.2.1. Installation & interface iMouseXP

* **iMouse XP New version**
  Page : “iMouse XP New version” dans “iPhone Farm Setup”. ([doc.some3c.com][1])
  Utile pour :

  * prérequis système,
  * installation / désinstallation,
  * différence entre *Kernel* et *Console*,
  * démarrage de la console.

👉 Référence lorsque tu prépares la machine Windows qui héberge iMouseXP et ton contrôleur.

---

#### 11.2.2. API générale (HTTP / WebSocket)

* **XP API Documentation**
  Page : “XP API Documentation”. ([doc.some3c.com][2])
  Utile pour :

  * comprendre les ports (HTTP & WebSocket sur `9911`),
  * format général des requêtes (`fun`, `data`),
  * codes de retour (`status`, `data.code`…).

Liens avec ta spec :

* Quand tu parles de **“petit client iMouseXP”** dans ton contrôleur (Section 10), tu te bases sur :

  * l’URL : `http://<ip-imouse>:9911/api`
  * le format JSON de base décrit ici.

---

#### 11.2.3. Lister les devices (Select devices)

* **Equipment related → 1. Get device list**
  Page : “Equipment related”, section `1. Get device list`. ([doc.some3c.com][3])
  Endpoint : `/device/get`

Ce que tu en tires pour ta spec :

* Correspond à ton step **“Refresh devices”** dans la section *Select devices*.
* Tu récupères :

  * `deviceid`, `device_name`, `width`, `height`, `gname`, `state`, etc.
* Tu utilises ces champs pour :

  * remplir `devices.json` (idImouse, label, width/height…),
  * alimenter la liste “All Devices (N)” dans l’UI.

---

#### 11.2.4. Contrôle souris & clavier (actions Like / Comment / Save / Scroll)

* **Keyboard and Mouse** ([doc.some3c.com][4])
  Principales sections utilisées :

1. **Mouse clicks**

   * `fun: "/mouse/click"`
   * paramètres : `id`, `x`, `y`, `button`, etc.
     → utilisé pour :

     * clic **Like** (coordonnées `coords.like`),
     * clic **Comment** (coordonnées `coords.comment`),
     * clic **Save** (coordonnées `coords.save`),
     * clic sur le bouton “Envoyer” du commentaire.

2. **Mouse slide**

   * `fun: "/mouse/swipe"`
   * paramètres : `id`, `direction`, `len`, `stepping`, `step_sleep`, etc.
     → utilisé pour :

     * action **Scroll** dans ta boucle d’automation (passer à la vidéo suivante).

3. **Keyboard Input**

   * section “Keyboard Input” (même page)
     → utilisé pour :

     * **taper le commentaire** dans le champ de texte après avoir cliqué sur le bouton “comment”.

Lien avec ta spec :

* Tout ce que tu décris dans **“5. Exécuter l’action”** (clic Like/Comment/Save, scroll, entrée de texte) repose exactement sur ces endpoints.

---

#### 11.2.5. Screenshot & OCR (Picture Text Recognition)

* **Picture Text Recognition** ([doc.some3c.com][5])
  Section utilisée :

1. **Take a screenshot**

   * `fun: "/pic/screenshot"`
   * paramètres : `id`, `binary`, `jpg`, `rect`, `save_path`.
     → utilisé pour :

     * **prendre le screenshot** plein écran de la vidéo,
     * soit récupérer un fichier local (via `save_path`),
     * soit récupérer des **données binaires** si `binary: true`.

2. (Facultatif) **OCR text recognition / Find text**

   * Si un jour tu veux :

     * récupérer du texte directement depuis l’écran **sans** passer par OpenAI Vision (par ex. lire un titre, un bouton),
     * faire du “Find text” sur la UI.

Lien avec ta spec :

* C’est cette section qui supporte ton step **“Screenshot → Analyse Vision”** dans la boucle.
* Tu lis ici les détails nécessaires pour implémenter ton wrapper `takeScreenshot(deviceId, binary=true)`.

---

### 11.3. Documentation OpenAI (Vision & Texte)

Pour la partie **“Analyse Vision”** de tes specs, et éventuellement la génération de commentaires, tu t’appuies sur les docs suivantes :

#### 11.3.1. Guide Images & Vision

* **Images and vision – OpenAI API** ([OpenAI Platform][6])
  Explique :

  * comment envoyer des images (fichiers ou base64) au modèle,
  * comment demander une réponse structurée (JSON) décrivant l’image,
  * exemples de prompts et de formats de réponse.

Lien avec ta spec :

* Couvre ton step **“Analyse Vision”** dans la boucle :

  * Tu y trouves comment appeler le modèle avec le screenshot renvoyé par iMouseXP,
  * Comment construire la réponse type (`caption`, `topics`, etc.) à partir des exemples.

---

#### 11.3.2. Quickstart (mise en place générale)

* **Developer quickstart – OpenAI API** ([OpenAI Platform][7])
  Utile pour :

  * setup global (API key, client Node/Python),
  * exemples rapides d’appels incluant des images.

Lien avec ta spec :

* Source principale pour la mise en place du **contrôleur d’automation** (partie “Backend local”) :

  * comment instancier le client,
  * comment faire un simple appel Vision pour un test manuel.

---

#### 11.3.3. API Reference – Chat / Vision

* **Chat API Reference** ([OpenAI Platform][8])
  Utile pour :

  * syntaxe exacte des payloads pour `chat.completions`,
  * comment inclure une image dans les `messages` (role `user`, `content` avec type `input_image`),
  * paramètres comme `response_format: { "type": "json_object" }` si tu veux du JSON strict.

Lien avec ta spec :

* Correspond à ton idée de réponse **structurée** type :

  ```json
  {
    "caption": "...",
    "topics": ["dance", "girl"],
    "should_comment": true,
    "comment_style": "compliment"
  }
  ```

* Tu t’inspires de ces docs pour :

  * construire ton prompt,
  * demander un JSON,
  * parser le résultat dans le contrôleur.

---

### 11.4. Comment tout relier rapidement

Voici le mapping “spec → doc” pour coder sans te perdre :

1. **Découverte des devices (Select devices / Refresh)**

   * Spec : Section “Flow 1 – Découverte des devices”
   * Docs :

     * XP API Documentation (ports, format global) ([doc.some3c.com][2])
     * Equipment related → `1. Get device list` (/device/get) ([doc.some3c.com][3])

2. **Stocker les infos devices (devices.json)**

   * Spec : Section “4.2 Fichier devices.json”
   * Docs :

     * Réponse `/device/get` (width, height, deviceid, gname…).

3. **Clics Like / Comment / Save**

   * Spec : “6.2 Cycle pour un device → Exécuter l’action”
   * Docs :

     * Keyboard and Mouse → `Mouse clicks` (/mouse/click). ([doc.some3c.com][4])

4. **Scroll vertical**

   * Spec : même section que ci-dessus (scroll)
   * Docs :

     * Keyboard and Mouse → `Mouse slide` (/mouse/swipe). ([doc.some3c.com][4])

5. **Écrire des commentaires**

   * Spec : action `COMMENT`
   * Docs :

     * Keyboard and Mouse → `Keyboard Input`. ([doc.some3c.com][4])

6. **Screenshots**

   * Spec : “6.2 Cycle pour un device → Screenshot”
   * Docs :

     * Picture Text Recognition → `Take a screenshot` (/pic/screenshot). ([doc.some3c.com][5])

7. **Analyse Vision**

   * Spec : “6.2 Cycle pour un device → Analyse Vision + Évaluation des triggers”
   * Docs :

     * Images & vision guide (comment envoyer l’image, demander un JSON) ([OpenAI Platform][6])
     * Chat API Reference (forme exacte de la requête image+texte). ([OpenAI Platform][8])

8. **Boucle d’automation / logique métier**

   * Spec : “6.1 Boucle globale” et “6.2 Cycle pour un device”
   * Docs :

     * Quickstart OpenAI pour la mise en place générale du client ([OpenAI Platform][7])
     * XP API Documentation (gestion des retours `status`, `code`) ([doc.some3c.com][2])

---

[1]: https://doc.some3c.com/iphone-farm-setup/imouse-xp-new-version "iMouse XP New version | Some3C User Manual"
[2]: https://doc.some3c.com/xp-api-documentation "XP API Documentation | Some3C User Manual"
[3]: https://doc.some3c.com/xp-api-documentation/equipment-related "Equipment related | Some3C User Manual"
[4]: https://doc.some3c.com/xp-api-documentation/keyboard-and-mouse "Keyboard and Mouse | Some3C User Manual"
[5]: https://doc.some3c.com/xp-api-documentation/picture-text-recognition "Picture Text Recognition | Some3C User Manual"
[6]: https://platform.openai.com/docs/guides/images-vision?utm_source=chatgpt.com "Images and vision - OpenAI API"
[7]: https://platform.openai.com/docs/quickstart?utm_source=chatgpt.com "Developer quickstart - OpenAI API"
[8]: https://platform.openai.com/docs/api-reference/chat?utm_source=chatgpt.com "API Reference"
