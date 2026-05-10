# Surface produit Volcano Fund

## Tranche live actuelle

Volcano Fund dispose d’une landing privée brandée au-dessus de l’interface de workflows existante d’AI Hedge Fund.

La landing inclut maintenant une interface Volcano Fund en français : connexion CLI Codex Max par device code, mode d’emploi intégré, statut de couverture marchés/Forex, brief de recherche guidé, persistance serveur, historique **brief → flux → exécution**, fiche décision post-run, panneau de **revue opérateur** persistante et snapshot de décision figé avec la revue. L’opérateur peut préparer une connexion Codex dédiée à Volcano Fund sans exposer de token, comprendre le parcours d’utilisation directement dans l’interface, choisir un modèle, modifier le responsable, modifier la liste de tickers, écrire une question de recherche, sauvegarder le brouillon côté backend, recharger les briefs récents depuis l’historique serveur, créer/ouvrir un vrai flux prérempli depuis ce brief, voir le statut flux/exécution lié, lire une fiche décision structurée après exécution, puis sauvegarder des notes de revue et le résumé décisionnel associé pour la dernière exécution.

URL live :

- `https://volcanofund.heiries.fr`

La surface est volontairement positionnée comme un **cockpit de recherche d’investissement assisté par IA** pour Raphaël et Alix, pas comme un produit de trading ou de conseil financier.

## Ce qui a changé

- Titre navigateur : `Volcano Fund`.
- Écran d’accueil vide : branding Volcano Fund, statut, accès privé.
- Textes de la surface Volcano Fund custom traduits en français : landing, brief, historique, revue opérateur, boutons et aides.
- Bloc `Mode d’emploi Volcano Fund` dans l’interface : Codex Max, brief, flux, exécution, historique et revue.
- Bloc `Couverture marchés` dans l’interface : actions/ETF disponibles selon données backend ; Forex spot quotidien ajouté pour les paires majeures (`EURUSD`, `EUR/USD`, `GBPUSD`, `USDJPY`, `EURUSD=X`).
- Panneau `Connexion Codex Max` : lance un device login Codex côté backend et affiche uniquement l’URL OpenAI + le code temporaire, jamais les tokens.
- Modèle par défaut Volcano Fund : les flux créés depuis un brief pré-sélectionnent Codex CLI `gpt-5.4` pour les analystes et le gérant ; le backend garde le même fallback serveur pour éviter un lancement `/hedge-fund/run` sans modèle.
- Backend route `GET /codex-auth/status`, `POST /codex-auth/device-login`, `DELETE /codex-auth/device-login`.
- Le backend utilise un `CODEX_HOME` persistant sous `/app/data/codex-home` pour isoler l’auth Codex de Volcano Fund.
- Les données applicatives backend (flows, briefs, reviews) sont stockées dans `/app/data/hedge_fund.db`, monté depuis `data/`, afin de survivre aux rebuilds/restarts Docker.
- L’onglet de sortie affiche une `Fiche décision Volcano Fund` après un run : verdict par ticker, conviction, action lisible, arguments pour, risques/contre-arguments, points à vérifier et prochaine action humaine recommandée.
- Cette fiche est une synthèse heuristique déterministe construite depuis `decisions` et `analyst_signals`; elle ne remplace ni la revue Raphaël/Alix ni un conseil financier.
- Les contrôles de top bar ajoutés pour Volcano Fund ont des libellés/accessibilité en français.
- La landing contient des modèles de brief pour Raphaël et Alix, tickers éditables, responsable éditable, brouillon d’exécution et action `Créer et ouvrir le flux d’analyse`.
- Les briefs de recherche sont persistés côté serveur via `POST/GET/PUT/DELETE /research-briefs/`.
- L’endpoint enrichi `GET /research-briefs/history/` retourne chaque brief récent avec `flow_name`, `run_count`, `latest_run_id`, `latest_run_status`, timestamp de dernière exécution, et résumé de revue si disponible.
- Les revues opérateur des exécutions sont persistées via `GET/PUT/DELETE /run-reviews/{run_id}` dans la table `volcano_run_reviews`.
- À l’ouverture d’une revue depuis l’historique, l’UI charge le détail du dernier run via `/flows/{flow_id}/runs/{run_id}`, dérive le snapshot de fiche décision depuis `results`, puis le fige dans `extra_metadata.decision_snapshot` au moment de sauvegarder la revue.
- Le panneau de revue affiche le snapshot figé lorsqu’il existe, ou indique clairement quand il n’est pas encore disponible.
- Le panneau de brief charge l’historique serveur récent, peut restaurer un brief récent dans le formulaire, affiche le statut flux/exécution lié, et ouvre un panneau de revue pour la dernière exécution.
- Le panneau de revue stocke `review_status`, `decision`, `reviewer` et notes libres.
- L’action de création/ouverture sauvegarde ou met à jour le brief serveur, crée un vrai flow via `/flows/`, puis lie le brief au `flow_id` généré avec le statut `flow_created`.
- Les flux générés incluent un nœud d’entrée titres, des nœuds analystes, un gérant de portefeuille, des connexions, tags et métadonnées du brief.
- L’espace workflows existant, les sidebars, onglets, paramètres, API backend et ports runtime restent inchangés.

## Vérité produit

Statut actuel :

- Accès privé : Basic Auth Caddy.
- Runtime : backend et UI gérés par Docker/Compose, état sain.
- Codex Max : auth CLI dédiée à Volcano Fund possible par device code ; aucun token n’est retourné au frontend.
- Couverture marchés actuelle : actions/ETF via tickers classiques selon disponibilité des données backend.
- Forex : support initial branché via taux de référence quotidiens Frankfurter pour les paires ISO majeures. Formats acceptés : `EURUSD`, `EUR/USD`, `EUR-USD`, `EUR_USD`, `EURUSD=X`. Les données FX n’ont pas encore de volume ni d’OHLC intraday ; elles sont adaptées en open/high/low/close identiques au taux quotidien.
- Santé : backend `GET /healthz`, UI `GET /healthz`.
- Persistance briefs : table SQLite `volcano_research_briefs` + sauvegarde navigateur locale.
- Persistance flux : stockage serveur existant `/flows/`.
- Statut exécutions : agrégation en lecture seule depuis les données existantes `/flows/{flow_id}/runs`.
- Revue exécution : notes/statuts opérateur persistés dans `volcano_run_reviews`; c’est une métadonnée de revue humaine, pas du conseil financier automatisé.
- Snapshot décision : les cartes de fiche décision peuvent désormais être figées dans `volcano_run_reviews.extra_metadata.decision_snapshot` lors de la sauvegarde de la revue, pour conserver le résumé lu au moment de la décision humaine.
- Fiche décision : synthèse post-run non persistée séparément comme table dédiée pour cette tranche ; elle est recalculée côté UI depuis la sortie du run courant, puis éventuellement figée avec la revue opérateur.
- Trading : aucune exécution réelle de trading n’est activée.

Cette tranche francise la surface Volcano Fund que nous avons ajoutée dans le fork. L’UI upstream d’origine contient encore des écrans anglais hors de cette surface ; ils pourront être francisés progressivement ou via une vraie internationalisation `fr/en`.

## Prochaine tranche recommandée

Construire la tranche “détail de run persistant” Volcano Fund :

1. ajouter un tiroir dédié détail + revue d’exécution,
2. ajouter des snapshots avant/après décision pour les exécutions revues,
3. promouvoir le snapshot vers une table dédiée si l’historique devient multi-run / multi-review,
4. ajouter des presets analystes éditables par modèle de brief,
5. puis passer à une vraie auth applicative si l’usage multi-utilisateur devient important.
