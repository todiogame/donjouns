import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from generate_assets import main


def test_generated_placeholder_assets_exist():
    main()
    app_root = ROOT.parent
    assert (app_root / "src" / "assets" / "pics" / "sim_items" / "sim_item_001.png").exists()
    assert (app_root / "src" / "assets" / "pics" / "sim_items" / "sim_item_271.png").exists()
    assert (app_root / "src" / "assets" / "pics" / "monsters" / "monster_47.png").exists()
