import React, { useState, useEffect } from 'react';
import { Badge, Avatar, CircularProgress, Container } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GetAppIcon from '@mui/icons-material/GetApp';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import UpdateIcon from '@mui/icons-material/Update';
import { checkForUpdate } from '../utils/checkForUpdate';

const AutoUpdateBadge = () => {
  // ステータス: 'checking' | 'upToDate' | 'updateAvailable' | 'connectionError'
  const [status, setStatus] = useState('checking');
  // ダウンロード可能な場合、バージョン番号などを保持する例
  const [version, setVersion] = useState('');

  useEffect(() => {
    // コンポーネントがマウントされたら自動的にアップデート確認を開始
    const fetchUpdateStatus = async () => {
      const result = await checkForUpdate();

      // 返却メッセージに応じた状態判定（実装例。必要に応じて条件は調整してください）
      if (result.includes("アップデート確認エラー") || result.includes("サーバー接続できていない")) {
        setStatus('connectionError');
      } else if (result.includes("アップデートを適用して再起動しました")) {
        setStatus('updateAvailable');
        // 例: バージョン番号を抽出（例: "(v1.2.3)"）
        const match = result.match(/\(v(.+?)\)/);
        if (match) {
          setVersion(match[1]);
        }
      } else if (result.includes("最新バージョンです")) {
        setStatus('upToDate');
      } else {
        // 万が一判定できなかった場合は最新バージョンとする
        setStatus('upToDate');
      }
    };

    fetchUpdateStatus();
  }, []);

  // 状態に応じたバッジ用のコンテンツを返す
  const getBadgeContent = () => {
    switch (status) {
      case 'checking':
        return <CircularProgress size={16} />;
      case 'upToDate':
        return <CheckCircleOutlineIcon style={{ color: 'green' }} fontSize="small" />;
      case 'updateAvailable':
        return <GetAppIcon style={{ color: 'orange' }} fontSize="small" />;
      case 'connectionError':
        return <ErrorOutlineIcon style={{ color: 'red' }} fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
        <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        badgeContent={getBadgeContent()}
        >
        <Avatar>
            <UpdateIcon />
        </Avatar>
        </Badge>
    </Container >


  );
};

export default AutoUpdateBadge;
