from __future__ import annotations

import asyncio
import uuid

from fastapi import WebSocket

from .catalog import Catalog
from .engine import LiveGameEngine


BOT_ACTION_DELAY_SECONDS = 1.15


class GameRoom:
    def __init__(self):
        self.catalog = Catalog()
        self.clients: dict[str, WebSocket] = {}
        self.engine = LiveGameEngine(self.catalog, self.queue_action)
        self.pending_actions: list[dict] = []
        self.lock = asyncio.Lock()
        self.automation_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket) -> str:
        await websocket.accept()
        session_id = f"c-{uuid.uuid4().hex[:8]}"
        async with self.lock:
            self.clients[session_id] = websocket
            self.engine.add_human(session_id)
            await websocket.send_json({"type": "joined", "sessionId": session_id, "roomName": "room"})
            await self.broadcast_state_unlocked()
            self.ensure_automation_task_unlocked()
        return session_id

    async def disconnect(self, session_id: str):
        async with self.lock:
            self.clients.pop(session_id, None)
            self.engine.remove_player(session_id)
            await self.broadcast_state_unlocked()
            self.ensure_automation_task_unlocked()

    async def receive(self, session_id: str, payload: dict):
        message_type = payload.get("type")
        message = payload.get("message")
        async with self.lock:
            self.pending_actions = []
            self.engine.handle_message(session_id, message_type, message)
            for action in self.pending_actions:
                if action.get("type") == "endScores":
                    await self.broadcast_unlocked(action)
                else:
                    await self.broadcast_unlocked({"type": "game_action", "message": action})
            await self.broadcast_state_unlocked()
            self.ensure_automation_task_unlocked()

    def queue_action(self, action: dict):
        self.pending_actions.append(action)

    async def broadcast_state_unlocked(self):
        await self.broadcast_unlocked({"type": "state", "state": self.engine.snapshot()})

    async def broadcast_unlocked(self, payload: dict):
        dead: list[str] = []
        for session_id, client in self.clients.items():
            try:
                await client.send_json(payload)
            except Exception:
                dead.append(session_id)
        for session_id in dead:
            self.clients.pop(session_id, None)

    def ensure_automation_task_unlocked(self):
        if not self.engine.has_automated_turn():
            return
        if self.automation_task and not self.automation_task.done():
            return
        self.automation_task = asyncio.create_task(self.automation_loop())

    async def automation_loop(self):
        while True:
            await asyncio.sleep(BOT_ACTION_DELAY_SECONDS)
            async with self.lock:
                if not self.engine.has_automated_turn():
                    return
                self.pending_actions = []
                progressed = self.engine.advance_automation_step()
                if not progressed:
                    return
                for action in self.pending_actions:
                    if action.get("type") == "endScores":
                        await self.broadcast_unlocked(action)
                    else:
                        await self.broadcast_unlocked({"type": "game_action", "message": action})
                await self.broadcast_state_unlocked()
                if not self.engine.has_automated_turn():
                    return


room = GameRoom()
