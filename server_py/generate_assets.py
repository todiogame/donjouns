from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))

from game.catalog import Catalog  # noqa: E402


ROOT = Path(__file__).resolve().parents[1]
ITEM_DIR = ROOT / "src" / "assets" / "pics" / "sim_items"
MONSTER_DIR = ROOT / "src" / "assets" / "pics" / "monsters"
CARD_SIZE = (750, 1050)


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


def load_font(size: int, bold: bool = False):
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def hex_to_rgb(color: str) -> tuple[int, int, int]:
    value = color.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def gradient_image(size: tuple[int, int], start: str, end: str) -> Image.Image:
    width, height = size
    start_rgb = hex_to_rgb(start)
    end_rgb = hex_to_rgb(end)
    image = Image.new("RGB", size, start_rgb)
    pixels = image.load()
    for y in range(height):
        ratio = y / max(1, height - 1)
        row = tuple(int(start_rgb[i] * (1 - ratio) + end_rgb[i] * ratio) for i in range(3))
        for x in range(width):
            pixels[x, y] = row
    return image


def draw_centered(draw: ImageDraw.ImageDraw, y: int, text: str, font, fill: str):
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (CARD_SIZE[0] - (bbox[2] - bbox[0])) / 2
    draw.text((x, y), text, font=font, fill=fill)


def card_png(path: Path, title: str, subtitle: str, description: str, color: str = "#39424e"):
    image = Image.new("RGB", CARD_SIZE, "#101010").convert("RGBA")
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((0, 0, CARD_SIZE[0], CARD_SIZE[1]), radius=36, fill="#101010")

    inner = gradient_image((694, 994), color, "#111820").convert("RGBA")
    mask = Image.new("L", inner.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, inner.size[0], inner.size[1]), radius=28, fill=255)
    image.paste(inner, (28, 28), mask)
    draw.rounded_rectangle((28, 28, 722, 1022), radius=28, outline="#d6c38a", width=10)
    draw.rounded_rectangle((70, 340, 680, 760), radius=18, fill=(255, 255, 255, 20), outline="#d6c38a", width=3)

    kind_font = load_font(34, True)
    title_font = load_font(42, True)
    sigil_font = load_font(46, True)
    body_font = load_font(28, True)

    draw_centered(draw, 54, subtitle, kind_font, "#f8efd0")
    for index, line in enumerate(wrap_words(title, 19, 3)):
        draw_centered(draw, 112 + index * 46, line, title_font, "#ffffff")
    draw_centered(draw, 262, "DONJOUNS", sigil_font, (255, 255, 255, 54))
    for index, line in enumerate(wrap_words(description, 30, 9)):
        draw_centered(draw, 490 + index * 34, line, body_font, "#f6f0dd")

    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, format="PNG", optimize=True, compress_level=6)


def main(force: bool = False):
    catalog = Catalog()
    ITEM_DIR.mkdir(parents=True, exist_ok=True)
    generated = 0
    for item in catalog.items:
        path = ITEM_DIR / f"sim_item_{item.id:03d}.png"
        if force or not path.exists():
            card_png(path, item.name, "Objet", item.description, "#354753")
            generated += 1
    monster_47 = next(
        (card for card in catalog.dungeon_template.cartes if getattr(card, "index", None) == 46),
        None,
    )
    if monster_47 is not None:
        write(
            MONSTER_DIR / "monster_47.svg",
            card_svg(monster_47.titre, "Monstre", getattr(monster_47, "description", ""), "#552e35"),
        )
        monster_png = MONSTER_DIR / "monster_47.png"
        if force or not monster_png.exists():
            card_png(
                monster_png,
                monster_47.titre,
                "Monstre",
                getattr(monster_47, "description", ""),
                "#552e35",
            )
            generated += 1
    print(f"Generated {generated} placeholder asset(s)")


if __name__ == "__main__":
    main(force=True)
