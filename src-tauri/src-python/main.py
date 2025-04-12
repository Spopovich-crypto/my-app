# 📄 src-python/main.py

import sys
import json
import argparse
from pathlib import Path

sys.path.append(str(Path(__file__).parent / "libs"))
from csv_to_db.csv_to_db import run_csv_to_db


def main(args_dict):
    mode = args_dict.get("mode", "csv")

    if mode == "csv":
        return run_csv_to_db(args_dict)
    elif mode == "show":
        print("show mode")
    else:
        return {"error": f"Unknown mode: {mode}"}

if __name__ == "__main__":
    if not sys.stdin.isatty():
        # 🐍 呼び出し元が Tauri など → stdin から JSON を読む
        args_dict = json.load(sys.stdin)
    else:
        # 🖥 CLIで直接実行されたとき
        parser = argparse.ArgumentParser()
        parser.add_argument("--mode", default="csv")
        parser.add_argument("--folder", default="./data")
        parser.add_argument("--plant_name", default="工場A")
        args = parser.parse_args()
        args_dict = vars(args)
    
    print(f"args_dict: {args_dict}")
    result = main(args_dict)
