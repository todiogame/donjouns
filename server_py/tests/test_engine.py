import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from game.catalog import Catalog
from game.engine import LiveGameEngine


def test_solo_random_starts_with_bots_and_state():
    engine = LiveGameEngine(Catalog())
    engine.add_human("p1")
    engine.start("solo:random")
    state = engine.snapshot()
    assert engine.phase == "GAME_LOOP"
    assert len(state["players"]) == 3
    assert state["dungeonLength"] == 57
    assert isinstance(state["logs"], list)
    assert all(player["heroName"] for player in state["players"])


def test_draft_round_waits_for_human_choice():
    engine = LiveGameEngine(Catalog())
    engine.add_human("p1")
    engine.add_bot("p1")
    engine.add_bot("p1")
    engine.start("solo:draft")
    assert engine.phase == "DRAFT"
    assert len(engine.players[0].hand) == 7
    engine.select_card("p1", 0)
    assert len(engine.players[0].joueur.objets) == 1
    assert len(engine.players[0].hand) == 6


def test_autoplay_advances_one_step_at_a_time():
    engine = LiveGameEngine(Catalog())
    engine.add_human("p1")
    engine.start("autoplay:random")
    assert engine.has_automated_turn()
    before = engine.snapshot()["dungeonLength"]
    engine.advance_automation_step()
    after = engine.snapshot()["dungeonLength"]
    assert after <= before


def test_item_hook_animation_only_emits_on_real_change():
    actions = []
    engine = LiveGameEngine(Catalog(), actions.append)
    seat = engine.add_human("p1")

    class NoopItem:
        nom = "Noop"
        intact = True
        actif = False
        compteur = 0
        pv_bonus = 0
        modificateur_de = 0
        couleur = None
        types_tags = []
        puissance_tags = []

        def en_combat(self, *args):
            return None

    class ChangingItem(NoopItem):
        nom = "Changing"

        def en_combat(self, *args):
            self.intact = False

    engine._run_item_hook(seat, NoopItem(), "en_combat", "combat")
    assert actions == []

    engine._run_item_hook(seat, ChangingItem(), "en_combat", "combat")
    assert len(actions) == 1
    assert actions[0]["action"] == "item_used"
