from __future__ import annotations

import asyncio
import random
import uuid
from dataclasses import dataclass, field
from typing import Callable

from .catalog import Catalog
from .sim_bridge import (
    CarteEvent,
    CarteMonstre,
    DonjonDeck,
    Joueur,
    build_hook_tables,
    make_game_context,
    _preparer_monstre_pour_combat,
)


DEFAULT_NAMES = ["Sagarex", "Francis", "Mastho", "Mr.Adam"]
STARTING_ITEMS = 6
DRAFT_HAND_SIZE = 7
MAX_PLAYERS = 4


@dataclass
class LiveSeat:
    id: str
    name: str
    is_bot: bool = False
    joueur: Joueur | None = None
    hand: list = field(default_factory=list)
    selected_index: int = -1
    can_pass: bool = False
    disconnected: bool = False


class LiveGameEngine:
    def __init__(self, catalog: Catalog, emit_action: Callable[[dict], None] | None = None):
        self.catalog = catalog
        self.emit_action = emit_action or (lambda _message: None)
        self.hooks = build_hook_tables()
        self.players: list[LiveSeat] = []
        self.host_id = ""
        self.phase = "WAITING"
        self.game_mode = ""
        self.table_mode = "live"
        self.current_player_index = -1
        self.current_card = None
        self.winner = None
        self.final_players: list[LiveSeat] = []
        self.item_pool: list = []
        self.hero_pool: list = []
        self.jeu = make_game_context([])
        self.autoplay_task: asyncio.Task | None = None
        self.logs: list[str] = []

    def add_human(self, session_id: str) -> LiveSeat:
        if self.phase != "WAITING":
            raise RuntimeError("Cannot join a game in progress")
        seat = LiveSeat(session_id, f"Player {len(self.players) + 1}", False)
        self.players.append(seat)
        self.host_id = session_id
        return seat

    def remove_player(self, session_id: str):
        seat = self.find_seat(session_id)
        if not seat:
            return
        if self.phase in {"WAITING", "DRAFT"}:
            self.players = [p for p in self.players if p.id != session_id]
            if self.host_id == session_id:
                self.host_id = self.players[0].id if self.players else ""
        else:
            seat.disconnected = True
            if seat.joueur:
                seat.joueur.vivant = False
                seat.joueur.dans_le_dj = False
                seat.joueur.pv_total = 0
        self._ensure_current_player()

    def set_name(self, session_id: str, name: str):
        seat = self.find_seat(session_id)
        clean = " ".join((name or "").split()).strip()[:24]
        if seat and clean:
            seat.name = clean
            if seat.joueur:
                seat.joueur.nom = clean

    def add_bot(self, requester_id: str | None = None):
        if requester_id and self.host_id and requester_id != self.host_id:
            return
        if len(self.players) >= MAX_PLAYERS:
            return
        bot_id = f"bot-{uuid.uuid4().hex[:8]}"
        bot_name = f"Bot {len([p for p in self.players if p.is_bot]) + 1}"
        self.players.append(LiveSeat(bot_id, bot_name, True))

    def start(self, requested_mode: str = "live:random"):
        if self.phase != "WAITING" or not self.players:
            return
        self.table_mode, self.game_mode = self._parse_mode(requested_mode)
        self._normalize_players_for_table_mode()
        self._assign_heroes()
        self.item_pool = self.catalog.fresh_item_pool()
        random.shuffle(self.item_pool)
        self.jeu = make_game_context(
            [seat.joueur for seat in self.players],
            donjon=DonjonDeck(),
            objets_dispo=self.item_pool,
        )
        self.jeu.donjon.melange()
        for seat in self.players:
            seat.joueur.partie_joueurs = self.jeu.joueurs

        if self.game_mode == "draft":
            self._start_draft()
        else:
            self._deal_random_items()
            self._start_dungeon()

    def replay(self):
        names = [(p.id, p.name, p.is_bot) for p in self.players if not p.disconnected]
        self.__init__(self.catalog, self.emit_action)
        for pid, name, is_bot in names:
            seat = LiveSeat(pid, name, is_bot)
            self.players.append(seat)
        self.host_id = self.players[0].id if self.players else ""

    def handle_message(self, session_id: str, message_type: str, message):
        if message_type == "set_name":
            self.set_name(session_id, message if isinstance(message, str) else message.get("name", ""))
        elif message_type == "add_bot":
            self.add_bot(session_id)
        elif message_type == "start_game_request":
            if session_id == self.host_id:
                self.start((message or {}).get("mode") or "live:random")
        elif message_type == "select_card":
            self.select_card(session_id, int((message or {}).get("cardIndex", -1)))
        elif message_type == "pick_dungeon":
            self.pick_dungeon(session_id)
        elif message_type == "take_damage":
            self.take_damage(session_id)
        elif message_type == "pass_turn":
            self.pass_turn(session_id)
        elif message_type == "execute":
            self.execute_current(session_id)
        elif message_type == "use_item":
            self.use_item(session_id, int((message or {}).get("item_id", -1)), (message or {}).get("arg"))
        elif message_type == "escape_roll":
            self.escape_roll(session_id)
        elif message_type == "accept_event":
            self.resolve_event(session_id, True, (message or {}).get("arg"))
        elif message_type == "decline_event":
            self.resolve_event(session_id, False, (message or {}).get("arg"))
        elif message_type == "replay":
            self.replay()

    def select_card(self, session_id: str, card_index: int):
        if self.phase != "DRAFT":
            return
        seat = self.find_seat(session_id)
        if not seat or seat.is_bot or not (0 <= card_index < len(seat.hand)):
            return
        seat.selected_index = card_index
        self._process_draft_round()

    def pick_dungeon(self, session_id: str | None = None):
        if self.phase != "GAME_LOOP" or self.current_card is not None:
            return
        seat = self.current_seat()
        if not seat or (session_id and seat.id != session_id and not self._is_automated(seat)):
            return
        if self.jeu.donjon.vide:
            self.end_game()
            return
        self._run_start_turn_hooks(seat)
        if self.jeu.donjon.vide:
            self.end_game()
            return
        self.current_card = self.jeu.donjon.prochaine_carte()
        seat.can_pass = False
        if isinstance(self.current_card, CarteMonstre):
            self._prepare_current_monster(seat)
        else:
            self._run_event_encounter_hooks(seat, self.current_card)

    def take_damage(self, session_id: str | None = None):
        seat = self.current_seat()
        if not seat or not isinstance(self.current_card, CarteMonstre):
            return
        if session_id and seat.id != session_id and not self._is_automated(seat):
            return
        joueur = seat.joueur
        card = self.current_card
        self._run_auto_combat(seat, active=False)
        if getattr(card, "executed", False) or getattr(self.jeu, "carte_ignoree", False):
            self._finish_monster(seat, card, ignored=getattr(self.jeu, "carte_ignoree", False))
            return
        damage = max(0, int(getattr(card, "dommages", 0) or 0))
        joueur.pv_total -= damage
        if joueur.pv_total > 0:
            if getattr(card, "effet", "") != "MAUDIT" and card not in joueur.pile_monstres_vaincus:
                joueur.ajouter_monstre_vaincu(card)
            else:
                self.jeu.defausse.append(card)
        self._run_damage_hooks(seat, card)
        self._run_survival_hooks(seat, card)
        if joueur.pv_total <= 0:
            self._kill_player(seat, card)
        else:
            self._run_victory_hooks(seat, card)
            self._finish_monster(seat, card)

    def execute_current(self, session_id: str | None = None):
        seat = self.current_seat()
        if not seat or not isinstance(self.current_card, CarteMonstre):
            return
        if session_id and seat.id != session_id and not self._is_automated(seat):
            return
        if not self.jeu.execute_next_monster and not self._is_automated(seat):
            return
        self.current_card.executed = True
        if self.current_card not in seat.joueur.pile_monstres_vaincus:
            seat.joueur.ajouter_monstre_vaincu(self.current_card)
        self.jeu.execute_next_monster = False
        self._finish_monster(seat, self.current_card)

    def _emit_item_used(self, seat: LiveSeat, objet, source: str):
        catalog_item = self.catalog.item_by_object(objet)
        setattr(objet, "compteur", int(getattr(objet, "compteur", 0) or 0) + 1)
        self.emit_action(
            {
                "action": "item_used",
                "playerId": seat.id,
                "itemId": catalog_item.id,
                "title": getattr(objet, "nom", catalog_item.name),
                "texture": getattr(objet, "frontend_texture", catalog_item.texture),
                "source": source,
            }
        )

    def _run_item_hook(self, seat: LiveSeat, objet, hook_name: str, source: str, *args):
        self._emit_item_used(seat, objet, source)
        getattr(objet, hook_name)(*args)

    def use_item(self, session_id: str, item_id: int, arg=None):
        seat = self.find_seat(session_id)
        if not seat or not seat.joueur:
            return
        objet = next((item for item in seat.joueur.objets if self.catalog.item_by_object(item).id == item_id), None)
        if not objet:
            return
        try:
            if isinstance(self.current_card, CarteMonstre):
                self._run_item_hook(
                    seat,
                    objet,
                    "en_combat",
                    "active",
                    seat.joueur,
                    self.current_card,
                    self.jeu,
                    self.logs,
                )
            elif self.phase == "GAME_LOOP":
                if hasattr(objet, "debut_tour"):
                    self._run_item_hook(seat, objet, "debut_tour", "active", seat.joueur, self.jeu, self.logs)
        except Exception as exc:
            self.logs.append(f"{seat.name}: item {getattr(objet, 'nom', item_id)} failed: {exc}")
        if isinstance(self.current_card, CarteMonstre) and getattr(self.current_card, "executed", False):
            self._finish_monster(seat, self.current_card)

    def escape_roll(self, session_id: str | None = None):
        seat = self.current_seat()
        if not seat or self.phase != "GAME_LOOP":
            return
        if session_id and seat.id != session_id and not self._is_automated(seat):
            return
        joueur = seat.joueur
        roll = joueur.rollDice(self.jeu, self.logs)
        modifier = joueur.calculer_modificateurs()
        if type(joueur.perso_obj) not in self.hooks.p_fuite:
            joueur.perso_obj.en_fuite(joueur, self.jeu, self.logs)
        for objet in list(joueur.objets):
            if type(objet) not in self.hooks.o_fuite:
                self._run_item_hook(seat, objet, "en_fuite", "escape", joueur, self.jeu, self.logs)
        total = roll + modifier + getattr(joueur, "jet_fuite", 0)
        self.emit_action({"action": "animate_roll", "playerId": seat.id, "rollType": "escape"})
        self.emit_action({"action": "roll_result", "result": roll, "modifier": total - roll, "rollType": "escape"})
        if self.current_card is None:
            self.pick_dungeon(seat.id)
        if isinstance(self.current_card, CarteEvent):
            return
        if not isinstance(self.current_card, CarteMonstre):
            return
        if total >= int(getattr(self.current_card, "puissance", 0) or 0):
            joueur.fuite()
            self.jeu.donjon.rajoute_en_haut_de_la_pile(self.current_card)
            self.current_card = None
            seat.can_pass = False
            self._next_player()
        else:
            seat.can_pass = False

    def resolve_event(self, session_id: str | None, accepted: bool, arg=None):
        seat = self.current_seat()
        if not seat or not isinstance(self.current_card, CarteEvent):
            return
        if session_id and seat.id != session_id and not self._is_automated(seat):
            return
        card = self.current_card
        if accepted:
            self._apply_event_effect(seat, card, arg)
        self.jeu.defausse.append(card)
        self.current_card = None
        seat.can_pass = False

    def pass_turn(self, session_id: str | None = None):
        seat = self.current_seat()
        if not seat:
            return
        if session_id and seat.id != session_id and not self._is_automated(seat):
            return
        if self.current_card is not None:
            return
        self._run_end_turn_hooks(seat)
        seat.can_pass = False
        if seat.joueur:
            seat.joueur.tour += 1
            seat.joueur.rejoue = False
        self._next_player()

    def end_game(self):
        if self.phase == "END":
            return
        self.phase = "END"
        counted = []
        in_dungeon = [p for p in self.players if p.joueur and p.joueur.dans_le_dj]
        if in_dungeon:
            counted = in_dungeon
        else:
            counted = [p for p in self.players if p.joueur and p.joueur.vivant]
        for seat in self.players:
            if seat.joueur:
                seat.joueur.calculScoreFinal(self.logs)
                seat.joueur.compte_au_score = seat in counted
        counted.sort(key=lambda p: p.joueur.score_final, reverse=True)
        self.final_players = counted
        if counted:
            top = counted[0].joueur.score_final
            tied = [p for p in counted if p.joueur.score_final == top]
            self.winner = random.choice(tied)
            self.winner.joueur.medailles += 1
        else:
            self.winner = None
        self.current_player_index = -1
        self.current_card = None
        self.emit_action(
            {
                "type": "endScores",
                "winner": self.serialize_player(self.winner) if self.winner else None,
                "finalPlayers": [self.serialize_player(p) for p in self.final_players],
            }
        )

    def snapshot(self) -> dict:
        return {
            "phase": self.phase,
            "players": [self.serialize_player(seat) for seat in self.players],
            "hostId": self.host_id,
            "minPlayersToStart": 1,
            "maxPlayers": MAX_PLAYERS,
            "gameMode": f"{self.table_mode}:{self.game_mode}" if self.game_mode else "",
            "itemDeck": [self.catalog.serialize_item(item) for item in self.item_pool[-20:]],
            "currentPlayerIndex": self.current_player_index,
            "dungeon": [self.catalog.serialize_card(card) for card in self._remaining_dungeon_cards()],
            "dungeonLength": len(self._remaining_dungeon_cards()),
            "currentCard": self.catalog.serialize_card(self.current_card),
            "canTryToEscape": self.phase == "GAME_LOOP" and self.current_card is None and not self.jeu.donjon.vide,
            "canExecute": bool(
                self.phase == "GAME_LOOP"
                and isinstance(self.current_card, CarteMonstre)
                and self.jeu.execute_next_monster
            ),
            "trap": bool(getattr(self.jeu, "traquenard_actif", False)),
            "discardPile": [self.catalog.serialize_card(card) for card in getattr(self.jeu, "defausse", [])],
            "turnNumber": int(getattr(self.current_seat().joueur, "tour", 0) if self.current_seat() and self.current_seat().joueur else 0),
            "logs": [str(entry) for entry in self.logs[-250:]],
        }

    def serialize_player(self, seat: LiveSeat | None) -> dict | None:
        if seat is None:
            return None
        joueur = seat.joueur
        if not joueur:
            return {
                "id": seat.id,
                "name": seat.name,
                "isBot": seat.is_bot,
                "heroName": "",
                "hand": [],
                "stuff": [],
                "selectedItemCardIndex": seat.selected_index,
                "medals": 0,
                "hp": 0,
                "baseHP": 0,
                "canPass": False,
                "defeatedMonstersPile": [],
                "score": 0,
                "dead": False,
                "fled": False,
                "turnNumber": 0,
                "monstersBeatenThisTurn": 0,
                "disconnected": seat.disconnected,
            }
        can_use = self._can_use_item_for_seat(seat)
        return {
            "id": seat.id,
            "name": seat.name,
            "isBot": seat.is_bot,
            "heroName": getattr(joueur.perso_obj, "nom", ""),
            "hand": [self.catalog.serialize_item(item) for item in seat.hand],
            "stuff": [self.catalog.serialize_item(item, can_use(item)) for item in joueur.objets],
            "selectedItemCardIndex": seat.selected_index,
            "medals": int(getattr(joueur, "medailles", 0) or 0),
            "hp": int(getattr(joueur, "pv_total", 0) or 0),
            "baseHP": int(getattr(joueur, "pv_base", 0) or 0),
            "canPass": bool(seat.can_pass and self.current_card is None),
            "defeatedMonstersPile": [self.catalog.serialize_card(card) for card in joueur.pile_monstres_vaincus],
            "score": int(getattr(joueur, "score_final", 0) or len(joueur.pile_monstres_vaincus)),
            "dead": not bool(getattr(joueur, "vivant", True)),
            "fled": bool(getattr(joueur, "fuite_reussie", False)),
            "turnNumber": int(getattr(joueur, "tour", 0) or 0),
            "monstersBeatenThisTurn": int(getattr(joueur, "monstres_ajoutes_ce_tour", 0) or 0),
            "disconnected": seat.disconnected,
        }

    def find_seat(self, session_id: str) -> LiveSeat | None:
        return next((seat for seat in self.players if seat.id == session_id), None)

    def current_seat(self) -> LiveSeat | None:
        if 0 <= self.current_player_index < len(self.players):
            return self.players[self.current_player_index]
        return None

    def _parse_mode(self, requested_mode: str) -> tuple[str, str]:
        if ":" in requested_mode:
            table, game = requested_mode.split(":", 1)
        else:
            table, game = "live", requested_mode
        table = table if table in {"live", "solo", "autoplay"} else "live"
        game = "draft" if game == "draft" else "random"
        return table, game

    def _normalize_players_for_table_mode(self):
        if self.table_mode in {"solo", "autoplay"}:
            while len(self.players) < 3:
                self.add_bot()
        if self.table_mode == "autoplay":
            for seat in self.players:
                seat.is_bot = True

    def _assign_heroes(self):
        hero_ids = list(range(1, len(self.catalog.heroes) + 1))
        random.shuffle(hero_ids)
        for index, seat in enumerate(self.players):
            hero = self.catalog.clone_hero_by_id(hero_ids[index % len(hero_ids)])
            seat.joueur = Joueur(seat.name, hero, [])
            seat.joueur.client_id = seat.id
            seat.joueur.is_bot = seat.is_bot
            seat.can_pass = False

    def _deal_random_items(self):
        for _ in range(STARTING_ITEMS):
            for seat in self.players:
                if self.item_pool:
                    seat.joueur.ajouter_objet(self.item_pool.pop())

    def _start_draft(self):
        self.phase = "DRAFT"
        for _ in range(DRAFT_HAND_SIZE):
            for seat in self.players:
                if self.item_pool:
                    seat.hand.append(self.item_pool.pop())
        self._process_draft_round()

    def _process_draft_round(self):
        if self.phase != "DRAFT":
            return
        for seat in self.players:
            if seat.is_bot and seat.hand and seat.selected_index < 0:
                best = max(range(len(seat.hand)), key=lambda idx: getattr(seat.hand[idx], "priorite", 0))
                seat.selected_index = best
        if not self.players or any(seat.selected_index < 0 and seat.hand for seat in self.players):
            return
        for seat in self.players:
            if seat.hand and len(seat.joueur.objets) < STARTING_ITEMS:
                picked = seat.hand.pop(seat.selected_index)
                seat.joueur.ajouter_objet(picked)
            seat.selected_index = -1
        if all(len(seat.joueur.objets) >= STARTING_ITEMS for seat in self.players):
            for seat in self.players:
                self.item_pool.extend(seat.hand)
                seat.hand = []
            self._start_dungeon()
            return
        hands = [seat.hand for seat in self.players]
        if hands:
            rotated = hands[-1:] + hands[:-1]
            for seat, hand in zip(self.players, rotated):
                seat.hand = hand
        self._process_draft_round()

    def _start_dungeon(self):
        self.phase = "GAME_LOOP"
        for seat in self.players:
            seat.joueur.partie_joueurs = [p.joueur for p in self.players]
            seat.joueur.trier_objets_par_priorite()
            seat.joueur.appliquer_panoplies(self.logs)
            seat.joueur.perso_obj.debut_partie(seat.joueur, self.jeu, self.logs)
            for objet in list(seat.joueur.objets):
                objet.debut_partie(seat.joueur, self.jeu, self.logs)
        self.current_player_index = random.randrange(len(self.players))
        self.current_seat().joueur.tour = max(1, self.current_seat().joueur.tour)

    def has_automated_turn(self) -> bool:
        seat = self.current_seat()
        return bool(self.phase == "GAME_LOOP" and seat and self._is_automated(seat))

    def advance_automation_step(self) -> bool:
        if not self.has_automated_turn():
            return False
        seat = self.current_seat()
        if self.current_card is None:
            if seat.can_pass and not self._bot_should_continue(seat):
                self.pass_turn(seat.id)
            elif self._bot_should_escape(seat):
                self.escape_roll(seat.id)
            else:
                self.pick_dungeon(seat.id)
        elif isinstance(self.current_card, CarteEvent):
            self.resolve_event(seat.id, True)
        elif isinstance(self.current_card, CarteMonstre):
            self._run_auto_combat(seat, active=True)
            if self.current_card is not None:
                self.take_damage(seat.id)
        return True

    def _is_automated(self, seat: LiveSeat) -> bool:
        return seat.is_bot or self.table_mode == "autoplay"

    def _bot_should_escape(self, seat: LiveSeat) -> bool:
        if not seat.joueur or seat.joueur.tour <= 1:
            return False
        try:
            return bool(seat.joueur.deciderDeFuir(self.jeu, self.logs))
        except Exception:
            return seat.joueur.pv_total <= 3

    def _bot_should_continue(self, seat: LiveSeat) -> bool:
        if self.jeu.donjon.vide:
            return False
        try:
            return bool(seat.joueur.deciderDeRejouer(self.jeu, self.logs))
        except Exception:
            return seat.joueur.pv_total >= 6 and len(seat.joueur.pile_monstres_vaincus) < 3

    def _run_start_turn_hooks(self, seat: LiveSeat):
        joueur = seat.joueur
        if getattr(joueur, "_live_started_turn", False):
            return
        joueur._live_started_turn = True
        joueur.rejoue = False
        joueur.doit_passer = False
        joueur.reset_monstres_ajoutes()
        if type(joueur.perso_obj) not in self.hooks.p_debut:
            joueur.perso_obj.debut_tour(joueur, self.jeu, self.logs)
        for objet in list(joueur.objets):
            if type(objet) not in self.hooks.o_debut:
                self._run_item_hook(seat, objet, "debut_tour", "turn_start", joueur, self.jeu, self.logs)

    def _run_end_turn_hooks(self, seat: LiveSeat):
        joueur = seat.joueur
        if type(joueur.perso_obj) not in self.hooks.p_fin:
            joueur.perso_obj.fin_tour(joueur, self.jeu, self.logs)
        for objet in list(joueur.objets):
            if type(objet) not in self.hooks.o_fin:
                self._run_item_hook(seat, objet, "fin_tour", "turn_end", joueur, self.jeu, self.logs)
        joueur._live_started_turn = False

    def _run_event_encounter_hooks(self, seat: LiveSeat, card):
        for owner in self.players:
            if not owner.joueur:
                continue
            for objet in list(owner.joueur.objets):
                if type(objet) not in self.hooks.o_rencontre_event:
                    self._run_item_hook(
                        owner,
                        objet,
                        "en_rencontre_event",
                        "event",
                        owner.joueur,
                        seat.joueur,
                        card,
                        self.jeu,
                        self.logs,
                    )

    def _prepare_current_monster(self, seat: LiveSeat):
        try:
            _preparer_monstre_pour_combat(
                seat.joueur,
                self.current_card,
                self.jeu,
                self.logs,
                self.hooks.p_rencontre,
                self.hooks.o_rencontre,
            )
            for owner in self.players:
                if not owner.joueur:
                    continue
                for objet in list(owner.joueur.objets):
                    if type(objet) not in self.hooks.o_rencontre:
                        self._emit_item_used(owner, objet, "encounter")
        except Exception as exc:
            self.logs.append(f"prepare monster failed: {exc}")
            self.current_card.dommages = getattr(self.current_card, "puissance", 0)

    def _run_auto_combat(self, seat: LiveSeat, active: bool):
        joueur = seat.joueur
        card = self.current_card
        if not isinstance(card, CarteMonstre):
            return
        try:
            if type(joueur.perso_obj) not in self.hooks.p_combat:
                joueur.perso_obj.en_combat(joueur, card, self.jeu, self.logs)
            for objet in list(joueur.objets):
                if getattr(card, "executed", False) or getattr(self.jeu, "carte_ignoree", False):
                    break
                if not active and getattr(objet, "actif", False):
                    continue
                if type(objet) not in self.hooks.o_combat:
                    self._run_item_hook(seat, objet, "en_combat", "combat", joueur, card, self.jeu, self.logs)
            if not getattr(card, "executed", False) and type(joueur.perso_obj) not in self.hooks.p_combat_late:
                joueur.perso_obj.en_combat_late(joueur, card, self.jeu, self.logs)
        except Exception as exc:
            self.logs.append(f"combat hooks failed: {exc}")

    def _run_damage_hooks(self, seat: LiveSeat, card):
        for owner in self.players:
            if not owner.joueur:
                continue
            if type(owner.joueur.perso_obj) not in self.hooks.p_subit:
                owner.joueur.perso_obj.en_subit_dommages(owner.joueur, seat.joueur, card, self.jeu, self.logs)
            for objet in list(owner.joueur.objets):
                if type(objet) not in self.hooks.o_subit:
                    self._run_item_hook(
                        owner,
                        objet,
                        "en_subit_dommages",
                        "damage",
                        owner.joueur,
                        seat.joueur,
                        card,
                        self.jeu,
                        self.logs,
                    )

    def _run_survival_hooks(self, seat: LiveSeat, card):
        joueur = seat.joueur
        if joueur.pv_total > 0:
            return
        if type(joueur.perso_obj) not in self.hooks.p_survie:
            joueur.perso_obj.en_survie(joueur, card, self.jeu, self.logs)
        if joueur.pv_total <= 0:
            for objet in list(joueur.objets):
                if type(objet) not in self.hooks.o_survie:
                    self._run_item_hook(seat, objet, "en_survie", "survival", joueur, card, self.jeu, self.logs)
                    if joueur.pv_total > 0:
                        break

    def _run_victory_hooks(self, seat: LiveSeat, card):
        joueur = seat.joueur
        if type(joueur.perso_obj) not in self.hooks.p_vaincu:
            joueur.perso_obj.en_vaincu(joueur, joueur, card, self.jeu, self.logs)
        for owner in self.players:
            if not owner.joueur:
                continue
            for objet in list(owner.joueur.objets):
                if type(objet) not in self.hooks.o_vaincu:
                    self._run_item_hook(
                        owner,
                        objet,
                        "en_vaincu",
                        "victory",
                        owner.joueur,
                        joueur,
                        card,
                        self.jeu,
                        self.logs,
                    )

    def _finish_monster(self, seat: LiveSeat, card, ignored: bool = False):
        if self.current_card is card:
            self.current_card = None
        self.jeu.carte_ignoree = False
        seat.can_pass = bool(seat.joueur and seat.joueur.dans_le_dj)
        if self.jeu.donjon.vide:
            self.end_game()

    def _kill_player(self, seat: LiveSeat, card=None):
        joueur = seat.joueur
        if not joueur:
            return
        joueur.mort(self.logs)
        joueur.pv_total = 0
        for owner in self.players:
            if not owner.joueur:
                continue
            for objet in list(owner.joueur.objets):
                if type(objet) not in self.hooks.o_mort:
                    self._run_item_hook(
                        owner,
                        objet,
                        "en_mort",
                        "death",
                        owner.joueur,
                        joueur,
                        card,
                        self.jeu,
                        self.logs,
                    )
        self.current_card = None
        seat.can_pass = False
        self._ensure_current_player()

    def _apply_event_effect(self, seat: LiveSeat, card, arg=None):
        effect = getattr(card, "effet", "") or ""
        joueur = seat.joueur
        if effect == "HEAL":
            joueur.pv_total += 3
            for other in self.players:
                if other is not seat and other.joueur and other.joueur.dans_le_dj:
                    other.joueur.pv_total += 2
        elif effect == "ALLY":
            self.jeu.execute_next_monster = True
        elif effect == "TRAP":
            self.jeu.traquenard_actif = True
        elif effect == "INJECTION":
            for other in self.players:
                if other.joueur and other.joueur.dans_le_dj:
                    golems = sum(1 for monster in other.joueur.pile_monstres_vaincus if "Golem" in getattr(monster, "types", []))
                    other.joueur.pv_total += golems * 2
        elif effect == "REPAIR":
            broken = [item for item in joueur.objets if not getattr(item, "intact", True)]
            if broken:
                target = max(broken, key=lambda item: getattr(item, "pv_bonus", 0))
                target.repare()
                joueur.pv_total += getattr(target, "pv_bonus", 0)
        elif effect == "FORTUNE_WHEEL":
            joueur.pv_total += joueur.rollDice(self.jeu, self.logs)
        elif effect == "SHOP":
            if self.item_pool:
                joueur.ajouter_objet(self.item_pool.pop())
        elif effect == "SOULSTORM":
            for other in self.players:
                pile = other.joueur.pile_monstres_vaincus if other.joueur else []
                if other.joueur and other.joueur.dans_le_dj and pile:
                    returned = pile.pop()
                    self.jeu.donjon.ajouter_monstre(returned)
            self.jeu.donjon.remelange()
        elif effect == "DRAG":
            for other in self.players:
                if not other.joueur:
                    continue
                dragons = [m for m in other.joueur.pile_monstres_vaincus if "Dragon" in getattr(m, "types", [])]
                if dragons:
                    dragon = dragons[0]
                    other.joueur.pile_monstres_vaincus.remove(dragon)
                    self.jeu.defausse.append(dragon)
                    if self.item_pool:
                        other.joueur.ajouter_objet(self.item_pool.pop())

    def _can_use_item_for_seat(self, seat: LiveSeat):
        def can_use(objet) -> bool:
            if self.phase != "GAME_LOOP" or seat is not self.current_seat():
                return False
            if not getattr(objet, "intact", True):
                return False
            if isinstance(self.current_card, CarteMonstre):
                return bool(getattr(objet, "actif", False) or type(objet) not in self.hooks.o_combat)
            return bool(getattr(objet, "actif", False))

        return can_use

    def _remaining_dungeon_cards(self) -> list:
        donjon = self.jeu.donjon
        if not getattr(donjon, "ordre", None) is not None:
            return []
        return [donjon.cartes[int(index)] for index in donjon.ordre[donjon.index :]]

    def _next_player(self):
        self._ensure_current_player(advance=True)

    def _ensure_current_player(self, advance: bool = False):
        if self.phase != "GAME_LOOP" or not self.players:
            return
        living = [p for p in self.players if p.joueur and p.joueur.dans_le_dj]
        if not living:
            self.end_game()
            return
        start = self.current_player_index if self.current_player_index >= 0 else 0
        if advance:
            start += 1
        for offset in range(len(self.players)):
            idx = (start + offset) % len(self.players)
            seat = self.players[idx]
            if seat.joueur and seat.joueur.dans_le_dj:
                self.current_player_index = idx
                return
        self.end_game()
