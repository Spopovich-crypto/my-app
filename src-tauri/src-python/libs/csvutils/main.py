from .finder import find_csvs
from .processor import process_csv

import json
import sys

def run_csv_to_db(args):
    # 標準出力のみに出力
    print("CSVファイル処理を開始します", flush=True)
    
    # timeモジュールを一度だけインポート
    import time
    
    for i in range(100):
        # 標準出力のみに出力
        print(f"{i + 1}番目のCSVファイルを処理しています", flush=True)
        # 処理間に少し待機を入れる（バッファリング問題の確認用）- 待機時間を短縮
        time.sleep(0.1)
    
    print("全CSVファイルの処理が完了しました", flush=True)

    
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
