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
    import sys
    raw = sys.stdin.buffer.read()
    print("🧪 RAW BYTES:", list(raw), file=sys.stderr)  # stderrにバイナリ吐く（壊れてるかチェック）

    try:
        decoded = raw.decode("utf-8")
        print("🧪 DECODED:", decoded, file=sys.stderr)
    except UnicodeDecodeError as e:
        print("🧪 DECODE ERROR:", e, file=sys.stderr)
        raise

    import json
    return json.loads(decoded)


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

    sys.stdout.buffer.write(json.dumps(args, ensure_ascii=False).encode("utf-8"))
    sys.stdout.buffer.write(b"\n")

    result = main(args)

