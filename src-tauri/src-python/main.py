# 📄 src-python/main.py

import sys
import os
import json
import argparse
from pathlib import Path
import traceback

# UTF-8エンコーディングを強制的に使用
# バイナリモードではバッファリング=0（無効）を使用
import io
sys.stdout = io.TextIOWrapper(open(sys.stdout.fileno(), 'wb', buffering=0), encoding='utf-8', errors='backslashreplace')
sys.stderr = io.TextIOWrapper(open(sys.stderr.fileno(), 'wb', buffering=0), encoding='utf-8', errors='backslashreplace')

sys.path.append(str(Path(__file__).parent / "libs"))
from csvutils.main import run_csv_to_db
from showdata.main import show_data

def parse_args_from_cli():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", default="csv")
    parser.add_argument("--folder", default="./data")
    parser.add_argument("--plant_name", default="工場A")
    return vars(parser.parse_args())

def parse_args_from_stdin():
    import sys
    raw = sys.stdin.buffer.read()
    try:
        decoded = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        print("[DEBUG] DECODE ERROR:", e, file=sys.stderr, flush=True)
        raise

    import json
    return json.loads(decoded)


def main(args_dict):
    mode = args_dict.get("mode", "csv")
    if mode == "csv":
        return run_csv_to_db(args_dict)
    elif mode == "show":
        return show_data(args_dict)
    else:
        return {"status": "error", "message": f"Unknown mode: {mode}"}

if __name__ == "__main__":
    # デバッグ出力を削除
    try:
        args = parse_args_from_stdin() if not sys.stdin.isatty() else parse_args_from_cli()
    
        result = main(args)
        output = {
            "status": "success",
            "result": result
        }

        json_str = json.dumps(output, ensure_ascii=False, indent=2)
        print(json_str, flush=True)

    except Exception as e:
        tb_lines = traceback.format_exc().splitlines()
        error_output = {
            "status": "error",
            "message": str(e),
            "traceback": tb_lines
        }
        json_str = json.dumps(error_output, ensure_ascii=False, indent=2)
        print(json_str, flush=True)
