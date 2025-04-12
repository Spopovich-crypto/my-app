# 📄 src-python/main.py

import sys
import json
import argparse
from pathlib import Path

sys.path.append(str(Path(__file__).parent / "libs"))
from csv_to_db.csv_to_db import run_csv_to_db

def parse_args_from_cli():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", default="csv")
    parser.add_argument("--folder", default="./data")
    parser.add_argument("--plant_name", default="工場A")
    return vars(parser.parse_args())

def parse_args_from_stdin():
    return json.load(sys.stdin)


def main(args_dict):
    mode = args_dict.get("mode", "csv")
    if mode == "csv":
        return run_csv_to_db(args_dict)
    elif mode == "show":
        print("show mode")
    else:
        return {"error": f"Unknown mode: {mode}"}

if __name__ == "__main__":
    args = parse_args_from_stdin() if not sys.stdin.isatty() else parse_args_from_cli()
    print(f"args_dict: {args}")
    result = main(args)

