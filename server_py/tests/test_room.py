import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from game.room import GameRoom


class FakeWebSocket:
    def __init__(self):
        self.accepted = False
        self.closed = False
        self.sent = []

    async def accept(self):
        self.accepted = True

    async def send_json(self, payload):
        self.sent.append(payload)

    async def close(self, code=1000):
        self.closed = True
        self.close_code = code


def test_connect_resets_abandoned_in_progress_room():
    async def run():
        room = GameRoom()
        room.engine.add_human("old-client")
        room.engine.start("solo:random")
        assert room.engine.phase == "GAME_LOOP"
        assert not room.clients

        websocket = FakeWebSocket()
        session_id = await room.connect(websocket)

        assert websocket.accepted
        assert not websocket.closed
        assert websocket.sent[0]["type"] == "joined"
        assert websocket.sent[0]["sessionId"] == session_id
        assert websocket.sent[1]["type"] == "state"
        assert websocket.sent[1]["state"]["phase"] == "WAITING"
        assert len(room.engine.players) == 1

    asyncio.run(run())
