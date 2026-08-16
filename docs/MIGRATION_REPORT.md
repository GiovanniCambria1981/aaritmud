# Report di migrazione

## M0 — Audit e baseline

Completato.

- Fork GitHub: https://github.com/GiovanniCambria1981/aaritmud
- Upstream: https://github.com/CatCode79/aaritmud (`aarit-upstream` non usato; remote `upstream`)
- Tag: `upstream-aarit-1.1.3` su `d067415`
- Repository Vox esistente `GiovanniCambria1981/vox-mud-engine` **non toccato** (TypeScript distinto, storie Git non fuse)
- Inventario: `docs/LEGACY_INVENTORY.md`
- Mappa: `docs/LEGACY_TO_MODERN_MAPPING.md`
- Fixture: area `novizi`
- Baseline legacy isolata: non eseguibile qui (Python 2 assente). Comportamento da ricostruire dal codice.

## M1 parziale — Port Python 3 del codice Aarit

Eseguito sul branch `python3-port`.

Convertito, non riscritto:

- `print` statement → `print()`
- `xrange` → `range`
- `iteritems` / `itervalues` / `iterkeys` → `items` / `values` / `keys`
- `basestring` → `str`, `long()` → `int()`, `raw_input` → `input`, `file()` → `open()`
- `reload()` → `importlib.reload`
- `ConfigParser` → `configparser` (interpolation disattivata)
- `HTMLParser` / `cgi.escape` / `urllib.quote` → equivalenti Python 3
- concatenazioni `dict.values() + dict.values()` → `list(...) + list(...)`
- `sort(cmp=)` → `sort(key=)`
- `__cmp__` → confronti ricchi
- divisioni intere note (`//`) nei punti che in Python 2 troncavano
- check runtime: Python ≥ 3.8

Script usato: `tools/port_python3.js` (165 file toccati in automatico, poi correzioni manuali).

### Non verificato a runtime

Sulla macchina di lavoro non c’è un interprete Python 3 installato (solo stub Microsoft Store). Il port è sintattico e di libreria standard. Restano da verificare con `python -m compileall` e un boot `-b` quando Python 3.12 è disponibile.

### Debito residuo

- Twisted e Pillow restano dipendenze del runtime Aarit; il server Vox non deve basarsi su Twisted.
- `asizeof.py` è ancora un profiler storico.
- I gamescript in `data/proto_*` restano Python eseguibile.
- Non tutte le `/` intere del tree sono state convertite; solo i casi identificati nel core e nei controller usati dal vertical slice.
- Nessun test golden master ancora scritto.
- Il package `src/vox_mud/` non è stato creato in questo passo.

## Decisioni

- Non fondere questo fork con `vox-mud-engine` (storie e stack diversi).
- Non installare Python a livello di sistema senza richiesta esplicita.
- Area `novizi` come prima fixture.
