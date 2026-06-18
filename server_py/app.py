from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from game.room import room


app = FastAPI(title="Donjouns SimuDonjon Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"ok": True, "backend": "simudonjon"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    session_id = await room.connect(websocket)
    try:
        while True:
            payload = await websocket.receive_json()
            await room.receive(session_id, payload)
    except WebSocketDisconnect:
        await room.disconnect(session_id)
