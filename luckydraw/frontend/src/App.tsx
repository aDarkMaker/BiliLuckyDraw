import { useState, useEffect, useRef } from 'react';
import './App.css';
import QRCode from 'qrcode';
import { Login, GetAccountInfo, ConnectLiveRoom, StartLiveLottery, StopLiveLottery, DrawWinners, GetParticipantCount, IsLiveLotteryRunning, GetQRCode, CheckQRCodeStatus, LoginWithQRCode, IsLoggedIn } from "../wailsjs/go/main/App";

interface Winner {
  uid: number;
  username: string;
  count: number;
}

function App() {
  const [cookie, setCookie] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [message, setMessage] = useState('');
  
  const [roomID, setRoomID] = useState('');
  const [keyword, setKeyword] = useState('');
  const [winnerCount, setWinnerCount] = useState(1);
  const [connected, setConnected] = useState(false);
  const [lotteryRunning, setLotteryRunning] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [winners, setWinners] = useState<Winner[]>([]);
  
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrcodeKey, setQrcodeKey] = useState('');
  const [loginMethod, setLoginMethod] = useState<'cookie' | 'qrcode'>('qrcode');
  const isLoggingIn = useRef(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const loggedIn = await IsLoggedIn();
        if (loggedIn) {
          setLoggedIn(true);
          await loadAccountInfo();
        }
      } catch (e) {
        console.error('检查登录状态失败:', e);
      }
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const interval = setInterval(checkLotteryStatus, 1000);
    return () => clearInterval(interval);
  }, [connected]);

  useEffect(() => {
    if (showQRCode && qrcodeKey) {
      isLoggingIn.current = false;
      const interval = setInterval(async () => {
        if (isLoggingIn.current) {
          return;
        }
        
        try {
          const result = await CheckQRCodeStatus(qrcodeKey);
          const status = JSON.parse(result);
          
          if (status.code === 0 && status.data.code === 0) {
            clearInterval(interval);
            isLoggingIn.current = true;
            handleQRLogin(status.data.url);
          } else if (status.data.code === 86038) {
            clearInterval(interval);
            setMessage('二维码已过期，请重新获取');
            setShowQRCode(false);
          } else if (status.data.code === 86090) {
            setMessage('已扫码，请在手机上确认登录');
          }
        } catch (e: any) {
          console.error('检查状态失败:', e);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [showQRCode, qrcodeKey]);

  const checkLotteryStatus = async () => {
    if (!connected) return;
    
    try {
      const running = await IsLiveLotteryRunning();
      setLotteryRunning(running);
      
      if (running) {
        const count = await GetParticipantCount();
        setParticipantCount(count);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await Login(cookie);
      setMessage(result);
      setLoggedIn(true);
      await loadAccountInfo();
    } catch (e: any) {
      setMessage('登录失败: ' + e.message);
    }
  };

  const handleGetQRCode = async () => {
    try {
      const result = await GetQRCode();
      const qrInfo = JSON.parse(result);
      setQrCodeUrl(qrInfo.url);
      setQrcodeKey(qrInfo.qrcode_key);
      
      const qrDataUrl = await QRCode.toDataURL(qrInfo.url, {
        width: 200,
        margin: 2,
      });
      setQrCodeDataUrl(qrDataUrl);
      
      setShowQRCode(true);
      setMessage('请使用B站APP扫描二维码');
    } catch (e: any) {
      setMessage('获取二维码失败: ' + e.message);
    }
  };

  const handleQRLogin = async (loginURL: string) => {
    try {
      setMessage('正在验证登录...');
      const result = await LoginWithQRCode(loginURL);
      setMessage(result);
      setLoggedIn(true);
      setShowQRCode(false);
      await loadAccountInfo();
    } catch (e: any) {
      setMessage('登录失败: ' + e.message);
      setShowQRCode(false);
      isLoggingIn.current = false;
    }
  };

  const loadAccountInfo = async () => {
    try {
      const info = await GetAccountInfo();
      setAccountInfo(JSON.parse(info));
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnect = async () => {
    try {
      const id = parseInt(roomID);
      if (isNaN(id)) {
        setMessage('请输入有效的房间号');
        return;
      }
      
      await ConnectLiveRoom(id);
      setConnected(true);
      setMessage(`已连接到房间 ${roomID}`);
      setWinners([]);
    } catch (e: any) {
      setMessage('连接失败: ' + (e?.message || e || '未知错误'));
      console.error('ConnectLiveRoom error:', e);
    }
  };

  const handleStartLottery = async () => {
    try {
      await StartLiveLottery(keyword);
      setLotteryRunning(true);
      setMessage('开始收集弹幕...');
      setWinners([]);
    } catch (e: any) {
      setMessage('启动失败: ' + (e?.message || e || '未知错误'));
      console.error('StartLiveLottery error:', e);
    }
  };

  const handleStopLottery = async () => {
    try {
      await StopLiveLottery();
      setLotteryRunning(false);
      setMessage('已停止收集弹幕');
    } catch (e: any) {
      setMessage('停止失败: ' + (e?.message || e || '未知错误'));
      console.error('StopLiveLottery error:', e);
    }
  };

  const handleDraw = async () => {
    try {
      const result = await DrawWinners(winnerCount);
      const winnersData = JSON.parse(result);
      setWinners(winnersData);
      setMessage(`抽奖完成！共抽取 ${winnersData.length} 位获奖者`);
    } catch (e: any) {
      setMessage('抽奖失败: ' + (e?.message || e || '未知错误'));
      console.error('DrawWinners error:', e);
    }
  };

  return (
    <div className="container">
      <h1>🎉 B站直播间抽奖助手</h1>

      {!loggedIn ? (
        <div className="card">
          <h2>登录</h2>
          
          <div className="login-tabs">
            <button 
              className={`tab ${loginMethod === 'qrcode' ? 'active' : ''}`}
              onClick={() => setLoginMethod('qrcode')}
            >
              扫码登录
            </button>
            <button 
              className={`tab ${loginMethod === 'cookie' ? 'active' : ''}`}
              onClick={() => setLoginMethod('cookie')}
            >
              Cookie登录
            </button>
          </div>

          {loginMethod === 'qrcode' ? (
            <div className="qrcode-login">
              {!showQRCode ? (
                <button className="btn" onClick={handleGetQRCode}>
                  获取二维码
                </button>
              ) : (
                <div className="qrcode-container">
                  <img src={qrCodeDataUrl} alt="二维码" className="qrcode" />
                  <p className="qrcode-tip">请使用B站APP扫描二维码</p>
                  <button className="btn btn-secondary" onClick={() => setShowQRCode(false)}>
                    取消
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="login-form">
              <textarea
                className="input"
                placeholder="请输入Cookie"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                rows={4}
              />
              <button className="btn" onClick={handleLogin}>
                登录
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="card">
            <h3>账号信息</h3>
            {accountInfo && (
              <div className="account-info">
                <div className="info-item">
                  <span className="label">昵称:</span>
                  <span className="value">{accountInfo.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">UID:</span>
                  <span className="value">{accountInfo.uid}</span>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3>连接直播间</h3>
            <div className="form-group">
              <input
                type="text"
                className="input"
                placeholder="输入直播间房间号"
                value={roomID}
                onChange={(e) => setRoomID(e.target.value)}
                disabled={connected}
              />
              {!connected ? (
                <button className="btn btn-primary" onClick={handleConnect}>
                  连接
                </button>
              ) : (
                <button className="btn btn-secondary" onClick={() => {
                  setConnected(false);
                  setLotteryRunning(false);
                  setWinners([]);
                }}>
                  断开
                </button>
              )}
            </div>
          </div>

          {connected && (
            <>
              <div className="card">
                <h3>抽奖设置</h3>
                <div className="form-group">
                  <label>关键词（可选）</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="留空则收集所有弹幕"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    disabled={lotteryRunning}
                  />
                </div>
                <div className="form-group">
                  <label>中奖人数</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={winnerCount}
                    onChange={(e) => setWinnerCount(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="controls">
                  {!lotteryRunning ? (
                    <button className="btn btn-primary" onClick={handleStartLottery}>
                      开始收集弹幕
                    </button>
                  ) : (
                    <button className="btn btn-secondary" onClick={handleStopLottery}>
                      停止收集
                    </button>
                  )}
                  <button 
                    className="btn btn-success" 
                    onClick={handleDraw}
                    disabled={participantCount === 0}
                  >
                    开始抽奖
                  </button>
                </div>
                {lotteryRunning && (
                  <div className="status">
                    <span className="status-dot"></span>
                    <span>正在收集弹幕... 当前参与人数: {participantCount}</span>
                  </div>
                )}
              </div>

              {winners.length > 0 && (
                <div className="card winners-card">
                  <h3>🎊 中奖名单</h3>
                  <div className="winners-list">
                    {winners.map((winner, index) => (
                      <div key={winner.uid} className="winner-item">
                        <span className="winner-rank">#{index + 1}</span>
                        <span className="winner-name">{winner.username}</span>
                        <span className="winner-uid">UID: {winner.uid}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {message && (
        <div className="message">
          {message}
        </div>
      )}
    </div>
  );
}

export default App;
