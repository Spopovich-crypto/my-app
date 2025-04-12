```

@tauri-apps/plugin-process


npm run tauri dev
npm run tauri build

cd src-tauri
cargo clean

uv pip install pandas --target ./python-embed/Lib/site-packages

```

1. 初回のみ: 秘密鍵と公開鍵を作る
```
npm run tauri signer generate // 
```

2. tauri.conf.jsonに公開鍵を設定
```
  "createUpdaterArtifacts": true,
  "plugins": {
    "updater": {
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IENCNUI3NjdCRTE2MUNBMkIKUldRcnltSGhlM1pieTNhdWppcW1IdkxMMzBPYUxiZ0h3cWg0OEIwS002MkN1VEJ4WFNpWGdGSHAK",
      "endpoints": [
        "http://localhost:8080/latest.json"
      ],
      "dangerousInsecureTransport": true,
      "dialog": true
    }
  }
```

3. 環境変数に設定してビルド
```
$env:TAURI_SIGNING_PRIVATE_KEY="TAURI_SIGNING_PRIVATE_KEY=dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5NU0rYUhXbm1QVWpjMWpzeGtDd0JiWjYrcDR3cGpxNW9lblhrZENZOFhHUUFBQkFBQUFBQUFBQUFBQUlBQUFBQXpoWXVUaUNpSy9tM3ZGckdBMHRBT21VY3MxaHFSaG91Vm53dVNRYTlRd2xoaFVIYVl5eEVuWXcyYUZpSHVNL2haZjVjZHJHdmtNVUs4c21vT3o4WkRsZkowNTk2TE9pZFd6L1VLNFFXYUhlUlJsMVovUkErOERjRmJzODZ4bG1odFNQZTJvKzk3Wk09Cg=="
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD="chinami"
npm run tauri build
```

```
Please enter a password to protect the secret key.
Password: 

<empty>
Password (one more time): 

<empty>
Deriving a key from the password in order to encrypt the secret key... done

Your secret key was generated successfully - Keep it secret!
dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5Q1kzaDhlZjl2TUdvWGtXbmswOWUycE1QMU4wajBkb1ZHZGZMTHVIa2tsUUFBQkFBQUFBQUFBQUFBQUlBQUFBQVdSbVJ4cEpuc2hMVVgwY25yd2cwdjlKS2gyMFc0U3MzQVhQeHVFOEFQTytKaVNpRHRVeXU2TzRFS21JMzdiM2xyazRUaCtFRTVNQmhxU0M2dEZjQkxPbFNrb0pDU21KeWlWc3FKSnE4YmdhNkUyRDJGV3NiRVc1Y2gwL2Z0WnhNZkxIeS8zRS9FdzA9Cg==


Your public key was generated successfully:
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDRDMDQxOUEzNENENDU0MzkKUldRNVZOUk1veGtFVFBWN1dwMGZuVzVVMzVOc20rNzM0YkIzTzRIb3d0emJQWkZtUCtLNm1IZm8K

Add the public key in your tauri.conf.json
```