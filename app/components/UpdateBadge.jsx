import React, { useState } from 'react';
import { checkForUpdate } from '../utils/checkForUpdate';
import { Button, Chip, CircularProgress, Container } from '@mui/material';

// Material UI のアイコン例
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GetAppIcon from '@mui/icons-material/GetApp';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function UpdateBadge() {
  // status: idle | checking | upToDate | updateAvailable | connectionError
  const [status, setStatus] = useState('idle');
  const [version, setVersion] = useState('');

  // アップデート確認ボタン押下時のハンドラー
  const handleCheckUpdate = async () => {
    setStatus('checking');
    const result = await checkForUpdate();
    
    // 返却文字列の内容によって状態を決定
    if (result.includes("アップデート確認エラー") || result.includes("サーバー接続できていない")) {
      setStatus('connectionError');
    } else if (result.includes("アップデートを適用して再起動しました")) {
      setStatus('updateAvailable');
      // バージョン番号があれば抽出（例："(v1.2.3)"）
      const match = result.match(/\(v(.+?)\)/);
      if (match) {
        setVersion(match[1]);
      }
    } else if (result.includes("最新バージョンです")) {
      setStatus('upToDate');
    } else {
      // 万が一判定できなかった場合は最新と見なす
      setStatus('upToDate');
    }
  };

  // 状態に応じたバッジ表示を返す
  const renderBadge = () => {
    switch (status) {
      case 'checking':
        return (
          <Chip
            icon={<CircularProgress size={16} />}
            label="アップデート確認中"
            variant="outlined"
          />
        );
      case 'upToDate':
        return (
          <Chip
            icon={<CheckCircleOutlineIcon />}
            label="最新バージョンを利用中"
            color="success"
          />
        );
      case 'updateAvailable':
        return (
          <Chip
            icon={<GetAppIcon />}
            label="ダウンロード可能な最新バージョンあり"
            color="warning"
          />
        );
      case 'connectionError':
        return (
          <Chip
            icon={<ErrorOutlineIcon />}
            label="サーバー接続できていないため、最新バージョン不明"
            color="error"
          />
        );
      default:
        return <Chip label="未確認" />;
    }
  };

  return (
    <Container maxWidth="md">
        <div>
        <Button variant="outlined" onClick={handleCheckUpdate}>
            アップデートを確認する
        </Button>
        <div style={{ marginTop: 16 }}>
            {renderBadge()}
        </div>
        {version && status === 'updateAvailable' && (
            <p>新バージョン: {version}</p>
        )}
        </div>
    </Container>

  );
}
