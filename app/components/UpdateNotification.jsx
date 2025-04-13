import { useState, useEffect } from 'react';
import { Bell, Download, CheckCircle } from 'lucide-react';

const UpdateNotification = () => {
  const [state, setState] = useState('available'); // 'available', 'downloading', 'complete'
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // アニメーション効果のデモンストレーション
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // ステートを順番に切り替えるデモ
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state === 'available') {
        setState('downloading');
      } else if (state === 'downloading') {
        setState('complete');
      } else {
        setState('available');
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [state]);
  
  // 非表示になる効果のデモ
  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsVisible(true), 3000);
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="flex flex-col items-center p-6 gap-6">
      {/* デザイン1: シンプルなバッジ */}
      <div className="flex items-center mb-6">
        <div className={`relative inline-flex ${isAnimating ? 'animate-bounce' : ''}`}>
          <button
            className="relative p-3 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-all duration-300"
            onClick={handleDismiss}
          >
            <Bell size={24} className="text-gray-700" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2">
              1
            </span>
          </button>
        </div>
        <div className="ml-4 bg-white shadow-md rounded-lg p-2 max-w-xs">
          <p className="text-sm font-medium text-gray-800">新しいアップデートがあります</p>
        </div>
      </div>
      
      {/* デザイン2: ステータス付きバッジ */}
      <div className="flex flex-col items-center mb-6">
        <div className={`rounded-full p-1 ${
          state === 'available' ? 'bg-blue-500' : 
          state === 'downloading' ? 'bg-amber-500' : 
          'bg-green-500'
        } ${isAnimating ? 'animate-pulse' : ''} shadow-lg transition-all duration-300`}>
          <div className="bg-white dark:bg-gray-900 rounded-full p-2">
            {state === 'available' && <Download size={24} className="text-blue-500" />}
            {state === 'downloading' && 
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            }
            {state === 'complete' && <CheckCircle size={24} className="text-green-500" />}
          </div>
        </div>
        <div className="mt-2 text-xs font-medium text-gray-600">
          {state === 'available' && 'アップデート可能'}
          {state === 'downloading' && 'ダウンロード中...'}
          {state === 'complete' && 'インストール完了'}
        </div>
      </div>
      
      {/* デザイン3: モダンなトースト通知 */}
      <div className={`flex items-center gap-3 bg-gray-800 text-white px-4 py-3 rounded-xl shadow-xl transform transition-all duration-300 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
        <div className={`p-2 rounded-full ${
          state === 'available' ? 'bg-blue-500' : 
          state === 'downloading' ? 'bg-amber-500' : 
          'bg-green-500'
        }`}>
          {state === 'available' && <Download size={20} className="text-white" />}
          {state === 'downloading' && 
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          }
          {state === 'complete' && <CheckCircle size={20} className="text-white" />}
        </div>
        <div>
          <h3 className="font-medium text-sm">
            {state === 'available' && 'アプリケーションアップデート'}
            {state === 'downloading' && 'ダウンロード中'}
            {state === 'complete' && 'アップデート完了'}
          </h3>
          <p className="text-xs text-gray-300">
            {state === 'available' && 'バージョン 2.1.0 が利用可能です'}
            {state === 'downloading' && '42% 完了'}
            {state === 'complete' && '再起動してインストールを完了します'}
          </p>
        </div>
        <button 
          className="ml-auto text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-all duration-200"
          onClick={handleDismiss}
        >
          {state === 'available' ? '今すぐ更新' : '閉じる'}
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;