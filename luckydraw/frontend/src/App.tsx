import { useState, useEffect, useRef } from 'react';
import './App.css';
import QRCode from 'qrcode';
import { Login, GetAccountInfo, GetConfig, SaveConfig, StartLottery, StopLottery, CheckPrize, IsRunning, GetQRCode, CheckQRCodeStatus, LoginWithQRCode } from "../wailsjs/go/main/App";

interface Config {
  uids: number[];
  tags: string[];
  articles: string[];
  key_words: string[];
  model: string;
  chat_model: string;
  wait: number;
  lottery_loop_wait: number;
  minfollower: number;
  relay: string[];
  chat: string[];
  notice_key_words: string[];
}

function App() {
  const [cookie, setCookie] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [checkResult, setCheckResult] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [qrcodeKey, setQrcodeKey] = useState('');
  const [loginMethod, setLoginMethod] = useState<'cookie' | 'qrcode'>('qrcode');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isLoggingIn = useRef(false);

  useEffect(() => {
    checkRunning();
    const interval = setInterval(checkRunning, 2000);
    return () => clearInterval(interval);
  }, []);

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
          console.log('二维码状态:', status);
          
          if (status.code === 0 && status.data.code === 0) {
            console.log('扫码成功，开始登录');
            console.log('登录URL:', status.data.url);
            clearInterval(interval);
            isLoggingIn.current = true;
            handleQRLogin(status.data.url);
          } else if (status.data.code === 86038) {
            console.log('二维码已过期');
            clearInterval(interval);
            setMessage('二维码已过期，请重新获取');
            setShowQRCode(false);
          } else if (status.data.code === 86090) {
            console.log('已扫码，等待确认');
            setMessage('已扫码，请在手机上确认登录');
          } else if (status.data.code === 86101) {
            console.log('等待扫码');
          }
        } catch (e: any) {
          console.error('检查状态失败:', e);
          setMessage('状态检查失败: ' + e.message);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [showQRCode, qrcodeKey]);

  const checkRunning = async () => {
    try {
      const isRunning = await IsRunning();
      setRunning(isRunning);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await Login(cookie);
      setMessage(result);
      setLoggedIn(true);
      loadAccountInfo();
      loadConfig();
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
      await loadConfig();
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

  const loadConfig = async () => {
    try {
      const cfgStr = await GetConfig();
      setConfig(JSON.parse(cfgStr));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    try {
      await SaveConfig(JSON.stringify(config));
      setMessage('配置已保存');
    } catch (e: any) {
      setMessage('保存失败: ' + e.message);
    }
  };

  const handleStart = async () => {
    try {
      const result = await StartLottery();
      setMessage(result);
      setRunning(true);
    } catch (e: any) {
      setMessage('启动失败: ' + e.message);
    }
  };

  const handleStop = async () => {
    try {
      await StopLottery();
      setMessage('已停止');
      setRunning(false);
    } catch (e: any) {
      setMessage('停止失败: ' + e.message);
    }
  };

  const handleCheck = async () => {
    try {
      const result = await CheckPrize();
      setCheckResult(result);
    } catch (e: any) {
      setCheckResult('检查失败: ' + e.message);
    }
  };

    return (
    <div className="app">
      <div className="header">
        <h1>B站抽奖助手</h1>
      </div>

      <div className="content">
        {!loggedIn ? (
          <div className="login-card">
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
              <h3>控制面板</h3>
              <div className="controls">
                <button
                  className={`btn btn-primary ${running ? 'disabled' : ''}`}
                  onClick={handleStart}
                  disabled={running}
                >
                  {running ? '运行中...' : '开始抽奖'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleStop}
                  disabled={!running}
                >
                  停止
                </button>
                <button className="btn btn-secondary" onClick={handleCheck}>
                  检查中奖
                </button>
              </div>
            </div>

            {config && (
              <div className="card">
                <h3>配置</h3>
                <div className="config-form">
                  <div className="form-group">
                    <label>监控UID (每行一个)</label>
                    <textarea
                      className="input"
                      value={config.uids.join('\n')}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          uids: e.target.value
                            .split('\n')
                            .map((v) => parseInt(v.trim()))
                            .filter((v) => !isNaN(v)),
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>关键词 (每行一个)</label>
                    <textarea
                      className="input"
                      value={config.key_words.join('\n')}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          key_words: e.target.value.split('\n').filter((v) => v.trim()),
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>转发间隔 (毫秒)</label>
                      <input
                        type="number"
                        className="input"
                        value={config.wait}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            wait: parseInt(e.target.value) || 30000,
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>循环等待 (毫秒, 0为不循环)</label>
                      <input
                        type="number"
                        className="input"
                        value={config.lottery_loop_wait}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            lottery_loop_wait: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveConfig}>
                    保存配置
                  </button>
                </div>
              </div>
            )}

            {checkResult && (
              <div className="card">
                <h3>中奖检查结果</h3>
                <pre className="result">{checkResult}</pre>
              </div>
            )}

            {message && (
              <div className={`message ${message.includes('失败') || message.includes('错误') ? 'error' : ''}`}>
                {message}
              </div>
            )}
          </>
        )}
            </div>
        </div>
  );
}

export default App;
