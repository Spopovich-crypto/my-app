# src-python/main.py
import sys
import json

def main():
    param = json.load(sys.stdin)
    print(f"{param['name']} says: {param['message']}")

if __name__ == "__main__":
    main()
