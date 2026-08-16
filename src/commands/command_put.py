# -*- coding: utf-8 -*-

"""
Modulo per la gestione del comando put.
"""

#= IMPORT ======================================================================

from src.config import config
from importlib import reload
from src.enums  import FLAG, ROOM
from src.log    import log

if config.reload_commands:
    reload(__import__("src.commands.__give_put__", globals(), locals(), [""]))
from src.commands.__give_put__ import give_or_put


#= COSTANTI ====================================================================

VERBS = {"infinitive" : "[orange]mettere[close]",
         "noun"       : "[orange]metterlo[close]",
         "you"        : "[orange]metti[close]",
         "you2"       : "[orange]metterti[close]",
         "it"         : "[orange]mette[close]"}


#= FUNZIONI ====================================================================

def command_put(entity, argument="", verbs=VERBS, behavioured=False):
    """
    Permette di dare entit�, di solito oggetti, ad altre entit�, di solito
    player.
    """
    # � possibile se il comando � stato deferrato
    if not entity:
        return False

    return give_or_put(entity, argument, verbs, behavioured, ("items", "mobs", "players"), FLAG.NO_PUT, ROOM.NO_PUT, "put", "putted", "putting", "in")
#- Fine Funzione -


def get_syntax_template(entity):
    if not entity:
        log.bug("entity non � un parametro valido: %r" % entity)
        return ""

    # -------------------------------------------------------------------------

    syntax  = "put <nome oggetto o creatura> <oggetto o creatura in cui mettere>\n"
    syntax += "put <nome porta> <direzione in cui reinserirla sui cardini>"

    return syntax
#- Fine Funzione -
