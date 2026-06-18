from __future__ import annotations

import html
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from game.catalog import Catalog  # noqa: E402


ROOT = Path(__file__).resolve().parents[1]
ITEM_DIR = ROOT / "src" / "assets" / "pics" / "sim_items"
MONSTER_DIR = ROOT / "src" / "assets" / "pics" / "monsters"


def wrap_words(text: str, limit: int = 24, max_lines: int = 8) -> list[str]:
    words = re.sub(r"<[^>]+>", "", text or "").replace("\\n", " ").split()
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        candidate = " ".join(current + [word])
        if len(candidate) > limit and current:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
        if len(lines) >= max_lines:
            break
    if current and len(lines) < max_lines:
        lines.append(" ".join(current))
    return lines[:max_lines]


def card_svg(title: str, subtitle: str, description: str, color: str = "#39424e") -> str:
    title_lines = wrap_words(title, 19, 3)
    desc_lines = wrap_words(description, 30, 9)
    title_text = "\n".join(
        f'<text x="375" y="{145 + i * 46}" text-anchor="middle" class="title">{html.escape(line)}</text>'
        for i, line in enumerate(title_lines)
    )
    desc_text = "\n".join(
        f'<text x="375" y="{520 + i * 34}" text-anchor="middle" class="body">{html.escape(line)}</text>'
        for i, line in enumerate(desc_lines)
    )
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1050" viewBox="0 0 750 1050">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="{color}"/>
      <stop offset="1" stop-color="#111820"/>
    </linearGradient>
  </defs>
  <rect width="750" height="1050" rx="36" fill="#101010"/>
  <rect x="28" y="28" width="694" height="994" rx="28" fill="url(#bg)" stroke="#d6c38a" stroke-width="10"/>
  <rect x="70" y="340" width="610" height="420" rx="18" fill="rgba(255,255,255,0.08)" stroke="#d6c38a" stroke-width="3"/>
  <text x="375" y="82" text-anchor="middle" class="kind">{html.escape(subtitle)}</text>
  {title_text}
  <text x="375" y="300" text-anchor="middle" class="sigil">DONJOUNS</text>
  {desc_text}
  <style>
    .kind {{ font: 700 34px Arial, sans-serif; fill: #f8efd0; letter-spacing: 0; }}
    .title {{ font: 800 42px Arial, sans-serif; fill: #ffffff; letter-spacing: 0; }}
    .sigil {{ font: 800 46px Arial, sans-serif; fill: rgba(255,255,255,0.20); letter-spacing: 0; }}
    .body {{ font: 600 28px Arial, sans-serif; fill: #f6f0dd; letter-spacing: 0; }}
  </style>
</svg>
"""


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main():
    catalog = Catalog()
    ITEM_DIR.mkdir(parents=True, exist_ok=True)
    for item in catalog.items:
        path = ITEM_DIR / f"sim_item_{item.id:03d}.svg"
        write(path, card_svg(item.name, "Objet", item.description, "#354753"))
    monster_47 = next(
        (card for card in catalog.dungeon_template.cartes if getattr(card, "index", None) == 46),
        None,
    )
    if monster_47 is not None:
        write(
            MONSTER_DIR / "monster_47.svg",
            card_svg(monster_47.titre, "Monstre", getattr(monster_47, "description", ""), "#552e35"),
        )
    print(f"Generated {len(catalog.items)} item placeholders and monster_47.svg")


if __name__ == "__main__":
    main()
