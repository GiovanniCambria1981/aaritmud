English description:

Aarit is a MUD playable via web browser and made in Python with twisted framework.
Descrizione in italiano:

Aarit è un MUD giocabile con un qualsiasi browser e scritto in Python, utilizza twisted per gestire le connessioni e semplici file testuali per la persistenza dei dati.

Per provare il gioco basta andare al link: http://www.aarit.it

---

## Fork e modernizzazione

Questo repository è un fork di [CatCode79/aaritmud](https://github.com/CatCode79/aaritmud) (GPL-2.0).

- Remote `upstream`: repository originale
- Tag `upstream-aarit-1.1.3`: stato importato senza modifiche
- Branch `python3-port`: codice Aarit adattato a Python 3

Il codice non richiede più Python 2. Serve **Python 3.8+** (obiettivo 3.12). Le dipendenze runtime storiche restano Twisted e, opzionalmente, Pillow e numpy.

```text
python start.py -b
```

`-b` esegue solo il boot di verifica. Documentazione di audit: `docs/LEGACY_INVENTORY.md`, `docs/LEGACY_TO_MODERN_MAPPING.md`, `docs/MIGRATION_REPORT.md`. 
