# 📄 src-python/main.py

import sys
import os
import json
import argparse
from pathlib import Path
import traceback

# 出力バッファを行単位に
sys.stdout = os.fdopen(sys.stdout.fileno(), 'w', buffering=1)

sys.path.append(str(Path(__file__).parent / "libs"))
from csvutils.main import run_csv_to_db

def parse_args_from_cli():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", default="csv")
    parser.add_argument("--folder", default="./data")
    parser.add_argument("--plant_name", default="工場A")
    return vars(parser.parse_args())

def parse_args_from_stdin():
    import sys
    raw = sys.stdin.buffer.read()
    print("🧪 RAW BYTES:", list(raw), file=sys.stderr, flush=True)  # stderrにバイナリ吐く（壊れてるかチェック）

    try:
        decoded = raw.decode("utf-8")
        print("🧪 DECODED:", decoded, file=sys.stderr, flush=True)
    except UnicodeDecodeError as e:
        print("🧪 DECODE ERROR:", e, file=sys.stderr, flush=True)
        raise

    import json
    return json.loads(decoded)


def main(args_dict):
    mode = args_dict.get("mode", "csv")
    if mode == "csv":
        return run_csv_to_db(args_dict)
    elif mode == "show":
        return {"status": "info", "message": "show mode"}
    else:
        return {"status": "error", "message": f"Unknown mode: {mode}"}

if __name__ == "__main__":
    print("hello, world.", flush=True)
    try:
        args = parse_args_from_stdin() if not sys.stdin.isatty() else parse_args_from_cli()
    
        result = main(args)
        output = {
            "status": "success",
            "result": result
        }

        json_str = json.dumps(output, ensure_ascii=False, indent=2)
        print(json_str, flush=True)

        # sys.stdout.buffer.write(json_str.encode("utf-8"))
        # sys.stdout.buffer.write(b"\n")

    except Exception as e:
        tb_lines = traceback.format_exc().splitlines()
        error_output = {
            "status": "error",
            "message": str(e),
            "traceback": tb_lines
        }
        json_str = json.dumps(error_output, ensure_ascii=False, indent=2)
        print(json_str, flush=True)

        # sys.stdout.buffer.write(json_str.encode("utf-8"))
        # sys.stdout.buffer.write(b"\n")
        




