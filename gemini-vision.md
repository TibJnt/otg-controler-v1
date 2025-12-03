**Feature request : Migration du modèle Vision vers Gemini 2.0 Flash-Lite via Vercel AI Gateway**

---

### 1. Contexte

* Aujourd'hui on utilise un modèle OpenAI (type GPT-4o mini) pour :

  * analyser des images,
  * renvoyer un **JSON structuré**.
* App interne, usage local uniquement, pas de besoin de DB ou d'architecture compliquée.

---

### 2. Objectif

Remplacer le modèle OpenAI actuel par **Gemini 2.0 Flash-Lite** (`gemini-2.0-flash-lite`) en passant par **Vercel AI Gateway** afin de :

* Bénéficier d'une **interface unifiée** pour accéder à plusieurs providers (OpenAI, Google, Anthropic, etc.)
* Garder un **flux multimodal** (texte + image(s)).
* Continuer à produire un **JSON proprement formaté** via le Vercel AI SDK.
* Simplifier la gestion des clés API (une seule clé `AI_GATEWAY_API_KEY`).
* Faciliter le switch entre providers sans changer le code.

---

### 3. Portée

* Intégrer **Vercel AI Gateway** comme point d'entrée unique pour les appels Vision.
* Utiliser le **Vercel AI SDK** (`ai` package) pour des appels simplifiés.
* Standardiser tous les nouveaux appels IA (texte + vision) sur le couple **AI SDK + AI Gateway** (plus de SDK natifs OpenAI/Google directement utilisés dans l'app).
* Remplacer tous les appels au modèle Vision OpenAI par des appels à `google/gemini-2.0-flash-lite` via le gateway.
* Prévoir la possibilité de switch entre providers via une simple variable de config.

---

### 4. Exigences techniques

**Auth & config**

* Créer une **API key Vercel AI Gateway** dans le dashboard Vercel (onglet AI Gateway → API keys).
* La stocker dans une variable d'environnement : `AI_GATEWAY_API_KEY`.
* Dans l'onglet **AI Gateway → Integrations**, connecter le provider **Google / Gemini** (BYOK) pour que le modèle `google/gemini-2.0-flash-lite` soit disponible.
* Le SDK détecte automatiquement cette variable et utilise AI Gateway par défaut quand un `model` est passé en simple string.

**Installation**

```bash
npm install ai zod
```

**Modèle**

* Identifiant via AI Gateway : `google/gemini-2.0-flash-lite`
* Alternative stable : `google/gemini-2.0-flash-lite-001`

**Appel simplifié avec Vercel AI SDK**

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

// Schéma de la réponse attendue
const VisionResponseSchema = z.object({
  caption: z.string().describe('Brief 1-2 sentence description'),
  topics: z.array(z.string()).describe('Key topics/themes'),
  contentType: z.enum(['dance', 'comedy', 'tutorial', 'music', 'food', 'fitness', 'fashion', 'gaming', 'pets', 'nature', 'other']),
  hasText: z.boolean(),
  textContent: z.string().optional(),
});

async function analyzeImage(imageBase64: string) {
  const result = await generateObject({
    model: 'google/gemini-2.0-flash-lite',  // AI Gateway route automatiquement
    schema: VisionResponseSchema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analyze this TikTok screenshot...' },
          // imageBase64 doit être une URL ou un data URI (data:image/jpeg;base64,...) déjà prêt à l'emploi
          { type: 'image', image: imageBase64 },
        ],
      },
    ],
  });

  return result.object;  // JSON typé automatiquement
}
```

**Vision (images)**

* Le SDK accepte des images sous forme d'URL, de data URI (`data:image/...;base64,...`) ou de binaire (`Uint8Array`).
* Si tu pars d'un base64 "nu", l'encapsuler côté appelant, par exemple : `image: \`data:image/jpeg;base64,${imageBase64}``.
* Support des formats : JPEG, PNG, WebP, GIF.

**Structured output (JSON)**

* Utiliser `generateObject()` avec un schéma Zod.
* Le SDK gère automatiquement la conversion vers le format attendu par chaque provider.
* Typage TypeScript automatique du retour.

**Compatibilité avec l'existant**

* Garder **le même format JSON** qu'avec OpenAI (mêmes clés, mêmes types).
* Gérer les erreurs (quota, refus, timeouts) via try/catch standard.

---

### 5. Tâches à réaliser

1. **API key Vercel AI Gateway**

   * Se connecter au dashboard Vercel.
   * Aller dans AI Gateway → API keys → Create key.
   * Ajouter dans `.env.local` :

     ```
     AI_GATEWAY_API_KEY=your_key_here
     ```

2. **Installation des dépendances**

   ```bash
   npm install ai zod
   ```

3. **Créer le client Gemini via AI Gateway**

   * Créer un fichier `src/lib/clients/gemini.ts` qui :

     * utilise `generateObject()` du SDK Vercel AI,
     * définit le schéma Zod pour la réponse Vision,
     * prend en entrée : prompt texte + image base64 (URL ou data URI déjà formaté),
     * renvoie le JSON parsé ou une erreur typée.

4. **Remplacement OpenAI → Gemini**

   * Modifier `src/lib/clients/vision.ts` pour utiliser le nouveau client.
   * Conserver les mêmes structures de données en entrée/sortie.

5. **Flag de provider**

   * Ajouter une config : `VISION_PROVIDER=openai|gemini`
   * Dans vision.ts, router vers le bon client selon la config.
   * Exemple :

     ```typescript
     const model = process.env.VISION_PROVIDER === 'gemini' 
       ? 'google/gemini-2.0-flash-lite' 
       : 'openai/gpt-4o-mini';
     ```

6. **Tests**

   * Test avec une image d'exemple + prompt.
   * Vérification que la réponse est un JSON valide et conforme au schéma.
   * Test d'un scénario d'erreur (clé manquante / mauvaise).

---

### 6. Critères d'acceptation

* Pour un même input (image + prompt), le backend appelle **Gemini 2.0 Flash-Lite via Vercel AI Gateway**.
* La réponse est **strictement un JSON valide**, automatiquement typé par Zod.
* Le format JSON respecte le schéma défini (et reste compatible avec le reste de l'app).
* L'authentification utilise `AI_GATEWAY_API_KEY` (pas de clé Gemini directe dans le code).
* Possibilité de repasser à OpenAI via `VISION_PROVIDER=openai`.

---

### 7. Avantages de Vercel AI Gateway

| Aspect                | Direct API                    | Vercel AI Gateway              |
| --------------------- | ----------------------------- | ------------------------------ |
| **Clés API**          | 1 par provider                | 1 seule (`AI_GATEWAY_API_KEY`) |
| **Switch provider**   | Changer l'endpoint + auth     | Changer juste le model ID      |
| **SDK**               | Différent par provider        | Unifié (`ai` package)          |
| **Structured output** | Format différent par provider | Zod schema universel           |
| **Monitoring**        | À implémenter                 | Dashboard Vercel intégré       |
| **Rate limiting**     | À gérer manuellement          | Géré par le gateway            |

---

### 8. Liens de documentation

```text
# Vercel AI Gateway
Documentation principale
https://vercel.com/docs/ai-gateway

Authentification (API keys)
https://vercel.com/docs/ai-gateway/authentication

Models & providers
https://vercel.com/docs/ai-gateway/models-and-providers

# Vercel AI SDK
Documentation SDK
https://sdk.vercel.ai/docs

generateObject (structured output)
https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object

Support multimodal (images)
https://sdk.vercel.ai/docs/foundations/prompts#multi-modal-messages

# Google Gemini via AI SDK
@ai-sdk/google provider
https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai

# Zod (validation)
Documentation Zod
https://zod.dev
```

---

### 9. Exemple de code complet

```typescript
// src/lib/clients/gemini.ts
import { generateObject } from 'ai';
import { z } from 'zod';

const VisionResponseSchema = z.object({
  caption: z.string(),
  topics: z.array(z.string()),
  contentType: z.enum([
    'dance', 'comedy', 'tutorial', 'music', 'food', 
    'fitness', 'fashion', 'gaming', 'pets', 'nature', 'other'
  ]),
  hasText: z.boolean(),
  textContent: z.string().optional(),
});

export type VisionResponse = z.infer<typeof VisionResponseSchema>;

const VISION_PROMPT = `Analyze this screenshot from a short-form video app (like TikTok).
Describe what you see and identify key topics/themes.
Focus on: activity shown, mood/style, visible text/hashtags.
Keep topics as single lowercase words.`;

export async function analyzeImageWithGemini(
  imageBase64: string
): Promise<{ success: boolean; result?: VisionResponse; error?: string }> {
  try {
    const { object } = await generateObject({
      model: 'google/gemini-2.0-flash-lite',
      schema: VisionResponseSchema,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_PROMPT },
            // imageBase64 doit être une URL ou un data URI (data:image/jpeg;base64,...) déjà prêt à l'emploi
            { type: 'image', image: imageBase64 },
          ],
        },
      ],
    });

    return { success: true, result: object };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

```typescript
// src/lib/clients/vision.ts (updated)
import { analyzeImageWithGemini } from './gemini';
import { analyzeImageWithOpenAI } from './openai'; // existing
import { getConfig } from '../config';

export async function analyzeImage(imageData: string) {
  const config = getConfig();
  
  if (config.visionProvider === 'gemini') {
    return analyzeImageWithGemini(imageData);
  }
  
  return analyzeImageWithOpenAI(imageData);
}
```

---

