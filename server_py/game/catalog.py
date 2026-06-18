from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from pathlib import Path

from .sim_bridge import (
    CarteEvent,
    CarteMonstre,
    DonjonDeck,
    ROOT_DIR,
    clone_hero,
    clone_objet,
    normalize_name,
    objets_disponibles,
    persos_disponibles,
)


APP_ROOT = ROOT_DIR.parent


def slugify(value: str) -> str:
    normalized = normalize_name(value)
    return normalized or "unknown"


@dataclass(frozen=True)
class CatalogItem:
    id: int
    name: str
    key: str
    texture: str
    description: str
    color: int | None
    active: bool
    prototype: object


@dataclass(frozen=True)
class CatalogHero:
    id: int
    name: str
    prototype: object


class Catalog:
    def __init__(self):
        self.old_item_textures = self._load_old_item_texture_map()
        self.visuals = self._load_visuals()
        self.items = self._build_items()
        self.heroes = self._build_heroes()
        self.dungeon_template = DonjonDeck()

    def _load_old_item_texture_map(self) -> dict[str, str]:
        path = APP_ROOT / "server" / "gamedata" / "items.csv"
        if not path.exists():
            return {}
        result: dict[str, str] = {}
        with path.open("r", encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                raw_id = (row.get("id") or "").strip()
                title = (row.get("Title") or "").strip()
                if raw_id.isdigit() and title:
                    result[normalize_name(title)] = f"items_{int(raw_id):03d}"
        return result

    def _load_visuals(self) -> dict[str, dict]:
        path = ROOT_DIR / "simudonjon" / "item_visuals.json"
        if not path.exists():
            return {}
        with path.open("r", encoding="utf-8") as handle:
            raw = json.load(handle)
        return {normalize_name(name): data for name, data in raw.items()}

    def _build_items(self) -> list[CatalogItem]:
        items: list[CatalogItem] = []
        for index, prototype in enumerate(objets_disponibles, start=1):
            name = prototype.nom
            norm = normalize_name(name)
            visual = self.visuals.get(norm, {})
            texture = self.old_item_textures.get(norm) or f"sim_item_{index:03d}"
            color = getattr(prototype, "couleur", None) or visual.get("color_code")
            description = visual.get("description") or getattr(prototype, "effet", None) or ""
            items.append(
                CatalogItem(
                    id=index,
                    name=name,
                    key=slugify(name),
                    texture=texture,
                    description=description,
                    color=color,
                    active=bool(getattr(prototype, "actif", False)),
                    prototype=prototype,
                )
            )
        return items

    def _build_heroes(self) -> list[CatalogHero]:
        return [
            CatalogHero(id=index, name=hero.nom, prototype=hero)
            for index, hero in enumerate(persos_disponibles, start=1)
        ]

    def clone_item_by_id(self, catalog_id: int):
        item = self.items[catalog_id - 1]
        clone = clone_objet(item.prototype)
        clone.catalog_id = item.id
        clone.frontend_key = item.key
        clone.frontend_texture = item.texture
        clone.frontend_description = item.description
        return clone

    def clone_hero_by_id(self, hero_id: int):
        return clone_hero(self.heroes[hero_id - 1].prototype)

    def item_by_object(self, objet) -> CatalogItem:
        catalog_id = getattr(objet, "catalog_id", None)
        if catalog_id:
            return self.items[catalog_id - 1]
        norm = normalize_name(getattr(objet, "nom", ""))
        for item in self.items:
            if normalize_name(item.name) == norm:
                return item
        fallback = self.items[0]
        return fallback

    def fresh_item_pool(self):
        return [self.clone_item_by_id(item.id) for item in self.items]

    def fresh_hero_pool(self):
        return [self.clone_hero_by_id(hero.id) for hero in self.heroes]

    def card_frontend_id(self, card) -> int:
        if isinstance(card, CarteEvent):
            return 101 + max(0, getattr(card, "index", 47) - 47)
        return int(getattr(card, "index", 0)) + 1

    def card_texture(self, card) -> str:
        card_id = self.card_frontend_id(card)
        if isinstance(card, CarteEvent):
            return f"event_{card_id}"
        return f"monster_{card_id:02d}"

    def serialize_item(self, objet, can_be_used: bool = False) -> dict:
        catalog_item = self.item_by_object(objet)
        return {
            "id": catalog_item.id,
            "_id": f"item-{catalog_item.id}-{id(objet)}",
            "texture": getattr(objet, "frontend_texture", catalog_item.texture),
            "title": getattr(objet, "nom", catalog_item.name),
            "active": "1" if getattr(objet, "actif", catalog_item.active) else "0",
            "color": str(getattr(objet, "couleur", catalog_item.color) or ""),
            "key": getattr(objet, "frontend_key", catalog_item.key),
            "description": getattr(objet, "frontend_description", catalog_item.description),
            "hp": int(getattr(objet, "pv_bonus", 0) or 0),
            "broken": not bool(getattr(objet, "intact", True)),
            "requireSetup": False,
            "ui": self.pick_item_ui(objet),
            "indication": None,
            "canBeUsed": bool(can_be_used),
            "usageCounter": int(getattr(objet, "compteur", 0) or 0),
        }

    def pick_item_ui(self, objet) -> str | None:
        name = normalize_name(getattr(objet, "nom", ""))
        if any(part in name for part in ("bouledecristal", "epeevengeresse")):
            return "number"
        if "daguevengeresse" in name:
            return "monster_type"
        if any(part in name for part in ("couteausuisse", "enclumeinstable")):
            return "my_items_broken"
        if any(part in name for part in ("bombepirate", "bombedemidas", "imprimante")):
            return "my_items_intact"
        if any(part in name for part in ("crane", "pelle", "mana")):
            return "my_pile"
        return None

    def serialize_card(self, card) -> dict:
        if card is None:
            return None
        card_id = self.card_frontend_id(card)
        is_event = isinstance(card, CarteEvent) or getattr(card, "event", False)
        base = {
            "id": card_id,
            "_id": f"card-{card_id}-{id(card)}",
            "texture": self.card_texture(card),
            "title": getattr(card, "titre", ""),
            "dungeonCardType": "event" if is_event else "monster",
            "description": getattr(card, "description", "") or "",
            "effect": getattr(card, "effet", "") or "",
        }
        if is_event:
            base.update({"event": True, "optional": True})
            return base
        base.update(
            {
                "power": int(getattr(card, "puissance", 0) or 0),
                "types": list(getattr(card, "types", []) or []),
                "damage": int(getattr(card, "dommages", getattr(card, "puissance", 0)) or 0),
                "timesDealDamage": 1,
                "specialUI": bool(getattr(card, "effet", "") in {"KRAKEN", "GUARDIAN_ANGEL", "SHAPESHIFTER"}),
            }
        )
        return base
