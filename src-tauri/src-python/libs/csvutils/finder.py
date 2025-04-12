from pathlib import Path
from typing import List

def find_csvs(folder: Path) -> List[Path]:
    return [p for p in folder.rglob("*.csv") if p.is_file()]