from .finder import find_csvs
from .processor import process_csv

import json
import sys

def run_csv_to_db(args):
    for i in range(10):
        print(f"{i}番目のCSVファイルを処理しています", flush=True)

    return {
        "message": "全CSV処理が完了しました"
    }
   
    # # 仮の結果
    # result = {
    #     "status": "success",
    #     "message": "CSV処理完了",
    #     "processed_files": ["log1.csv", "log2.csv"],
    #     "row_count": 2480
    # }
    # json_output = json.dumps(result, ensure_ascii=False, indent=2)
    # sys.stdout.buffer.write(json_output.encode("utf-8"))
    # sys.stdout.buffer.write(b"\n")


