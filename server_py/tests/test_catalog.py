import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from game.catalog import Catalog


def test_catalog_counts():
    catalog = Catalog()
    assert len(catalog.items) == 271
    assert len(catalog.heroes) == 34
    assert len(catalog.dungeon_template.cartes) == 57


def test_item_serializer_shape():
    catalog = Catalog()
    item = catalog.clone_item_by_id(1)
    payload = catalog.serialize_item(item, can_be_used=True)
    assert payload["id"] == 1
    assert payload["texture"]
    assert payload["title"]
    assert payload["canBeUsed"] is True
    assert "broken" in payload


def test_dungeon_serializer_shape():
    catalog = Catalog()
    monster = catalog.dungeon_template.cartes[0]
    event = catalog.dungeon_template.cartes[-1]
    monster_payload = catalog.serialize_card(monster)
    event_payload = catalog.serialize_card(event)
    assert monster_payload["dungeonCardType"] == "monster"
    assert monster_payload["texture"] == "monster_01"
    assert event_payload["dungeonCardType"] == "event"
    assert event_payload["texture"].startswith("event_")
