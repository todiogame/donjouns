from __future__ import annotations

import os
import random
import sys
import unicodedata
from pathlib import Path
from types import SimpleNamespace


ROOT_DIR = Path(__file__).resolve().parents[1]
SIMUDONJON_DIR = ROOT_DIR / "simudonjon"

if str(SIMUDONJON_DIR) not in sys.path:
    sys.path.insert(0, str(SIMUDONJON_DIR))

# The vendored simulator opens JSON files by relative path during import.
os.chdir(SIMUDONJON_DIR)

from objets import SANS_HOOK_OBJET, objets_disponibles  # noqa: E402
from heros import SANS_HOOK_PERSO, persos_disponibles  # noqa: E402
from joueurs import Joueur  # noqa: E402
from monstres import CarteEvent, CarteMonstre, DonjonDeck  # noqa: E402
from simu import _preparer_monstre_pour_combat  # noqa: E402


def normalize_name(value: str) -> str:
    decomposed = unicodedata.normalize("NFD", value or "")
    without_accents = "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")
    return "".join(ch.lower() for ch in without_accents if ch.isalnum())


def clone_objet(objet):
    return type(objet)()


def clone_hero(hero):
    level = getattr(hero, "level", None)
    try:
        return type(hero)(level) if level is not None else type(hero)()
    except TypeError:
        return type(hero)()


def build_hook_tables():
    return SimpleNamespace(
        o_rencontre=SANS_HOOK_OBJET["en_rencontre"],
        o_rencontre_event=SANS_HOOK_OBJET["en_rencontre_event"],
        o_vaincu=SANS_HOOK_OBJET["en_vaincu"],
        o_subit=SANS_HOOK_OBJET["en_subit_dommages"],
        o_combat=SANS_HOOK_OBJET["en_combat"],
        o_survie=SANS_HOOK_OBJET["en_survie"],
        o_mort=SANS_HOOK_OBJET["en_mort"],
        o_fuite=SANS_HOOK_OBJET["en_fuite"],
        o_fuite_def=SANS_HOOK_OBJET["en_fuite_definitive"],
        o_debut=SANS_HOOK_OBJET["debut_tour"],
        o_fin=SANS_HOOK_OBJET["fin_tour"],
        p_rencontre=SANS_HOOK_PERSO["en_rencontre"],
        p_subit=SANS_HOOK_PERSO["en_subit_dommages"],
        p_vaincu=SANS_HOOK_PERSO["en_vaincu"],
        p_combat=SANS_HOOK_PERSO["en_combat"],
        p_combat_late=SANS_HOOK_PERSO["en_combat_late"],
        p_survie=SANS_HOOK_PERSO["en_survie"],
        p_fuite=SANS_HOOK_PERSO["en_fuite"],
        p_debut=SANS_HOOK_PERSO["debut_tour"],
        p_fin=SANS_HOOK_PERSO["fin_tour"],
    )


def make_game_context(joueurs, donjon=None, objets_dispo=None):
    jeu = SimpleNamespace()
    jeu.defausse = []
    jeu.tour = 0
    jeu.execute_next_monster = False
    jeu.traquenard_actif = False
    jeu.traquenard_paye = False
    jeu.carte_ignoree = False
    jeu.kraken_vu = False
    jeu.joueurs = joueurs
    jeu.donjon = donjon or DonjonDeck()
    jeu.objets_dispo = objets_dispo if objets_dispo is not None else []
    jeu.nb_joueurs = len(joueurs)
    return jeu


def shuffle_in_place(items):
    random.shuffle(items)
    return items
