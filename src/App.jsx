import { useState, useEffect, useRef } from 'react';
import { apiCall } from './api';
import './App.css';

function App() {
  const [screen, setScreen] = useState('insert');
  const [cardNumber, setCardNumber] = useState('1234');
  const [pin, setPin] = useState('');
  const [pinEntered, setPinEntered] = useState('');
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState('');
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispensingAmount, setDispensingAmount] = useState(0);
  const [bills, setBills] = useState([]);
  const [cardInserted, setCardInserted] = useState(false);
  const [motorActive, setMotorActive] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [newCardNumber, setNewCardNumber] = useState('');
  const [newPin, setNewPin] = useState('');
  const [regMessage, setRegMessage] = useState('');

  const billIdRef = useRef(0);

  const insertCard = async () => {
    try {
      const data = await apiCall('/insert', 'POST', { cardNumber });
      setBalance(data.account.balance);
      setCardInserted(true);
      setTimeout(() => {
        setScreen('pin');
        setMessage('');
      }, 600);
    } catch (error) {
      setMessage('Card not found');
    }
  };

  const verifyPin = async () => {
    try {
      await apiCall('/verify-pin', 'POST', { cardNumber, pin: pinEntered });
      setScreen('menu');
      setMessage('Welcome');
      setPinEntered('');
    } catch (error) {
      setMessage('Invalid PIN');
      setPinEntered('');
    }
  };

  const getBalance = async () => {
    const data = await apiCall(`/balance/${cardNumber}`);
    setBalance(data.balance);
    setScreen('balance');
  };

  const withdraw = async (amt) => {
    if (isDispensing) return;
    try {
      const data = await apiCall('/withdraw', 'POST', { cardNumber, amount: amt });
      setBalance(data.newBalance);
      startDispense(amt);
      showReceipt('WITHDRAWAL', amt, data.newBalance);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const startDispense = (amt) => {
    setDispensingAmount(amt);
    setIsDispensing(true);
    setMotorActive(true);
    setScreen('dispensing');
    setBills([]);

    const count = Math.min(Math.ceil(amt / 20), 18);
    const denom = amt <= 40 ? 20 : amt <= 100 ? 50 : 100;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const id = ++billIdRef.current;
        const rx = (Math.random() - 0.5) * 50;
        const rr = (Math.random() - 0.5) * 22;
        const rrFinal = (Math.random() - 0.5) * 18;
        const ry = 38 + i * 2 + Math.random() * 6;
        setBills(prev => [...prev, { id, rx, rr, rrFinal, ry, denom }]);
      }, i * 200);
    }

    const total = count * 200 + 800;
    setTimeout(() => {
      setMotorActive(false);
      setIsDispensing(false);
      setSuccessMsg(`WITHDREW $${amt.toLocaleString()} SUCCESSFULLY`);
      setScreen('success');
    }, total);
  };

  const deposit = async (amt) => {
    try {
      const data = await apiCall('/deposit', 'POST', { cardNumber, amount: amt });
      setBalance(data.newBalance);
      setSuccessMsg(`DEPOSITED $${amt.toLocaleString()} SUCCESSFULLY`);
      showReceipt('DEPOSIT', amt, data.newBalance);
      setScreen('success');
    } catch (error) {
      setMessage(error.message);
    }
  };

  const getHistory = async () => {
    const data = await apiCall(`/history/${cardNumber}`);
    setHistory(data.transactions);
    setScreen('history');
  };

  const logout = () => {
    setScreen('insert');
    setPin('');
    setPinEntered('');
    setMessage('');
    setIsDispensing(false);
    setDispensingAmount(0);
    setBills([]);
    setMotorActive(false);
    setCardInserted(false);
    setReceiptVisible(false);
  };

  const registerCard = async () => {
    if (!newCardNumber || !newPin) {
      setRegMessage('Please fill in all fields');
      return;
    }
    try {
      await apiCall('/register', 'POST', { cardNumber: newCardNumber, pin: newPin });
      setRegMessage(`Card ${newCardNumber} registered!`);
      setTimeout(() => {
        setScreen('insert');
        setNewCardNumber('');
        setNewPin('');
        setRegMessage('');
        setMessage('New card ready!');
      }, 2000);
    } catch (error) {
      setRegMessage(error.message || 'Registration failed');
    }
  };

  const showReceipt = (type, amt, newBal) => {
    setReceiptData({ type, amt, newBal, cardNumber, date: new Date().toLocaleString() });
    setTimeout(() => {
      setReceiptVisible(true);
      setTimeout(() => setReceiptVisible(false), 5000);
    }, 1200);
  };

  const enterPinDigit = (d) => {
    if (pinEntered.length < 4) setPinEntered(p => p + d);
  };

  const clearPinDigit = () => setPinEntered(p => p.slice(0, -1));

  // ── Screens ──────────────────────────────────────────────

  const renderInsertScreen = () => (
    <div className="atm-screen-content">
      <div className="atm-screen-header">
        <div className="atm-screen-title">SECURENET ATM</div>
        <div className="atm-screen-sub">AUTOMATED TELLER MACHINE</div>
      </div>
      <div className="atm-field-label">CARD NUMBER</div>
      <input
        className="atm-input atm-input-center"
        type="text"
        maxLength="4"
        placeholder="____"
        value={cardNumber}
        onChange={e => setCardNumber(e.target.value)}
      />
      <button className="atm-btn atm-btn-primary" onClick={insertCard}>INSERT CARD</button>
      <div style={{display:'flex',gap:6,marginTop:4}}>
        <button className="atm-btn atm-btn-ghost" style={{flex:1}} onClick={() => { setCardNumber('1234'); setTimeout(insertCard, 50); }}>DEMO: 1234</button>
        <button className="atm-btn atm-btn-ghost" style={{flex:1}} onClick={() => { setCardNumber('9999'); setTimeout(insertCard, 50); }}>DEMO: 9999</button>
      </div>
      <button className="atm-btn atm-btn-info" style={{marginTop:4}} onClick={() => setScreen('register')}>+ NEW CARD REGISTRATION</button>
      {message && <p className="atm-msg atm-msg-err">{message}</p>}
      <div className="atm-footer-note">PROTECTED BY 256-BIT SSL ENCRYPTION</div>
    </div>
  );

  const renderPinScreen = () => (
    <div className="atm-screen-content">
      <div className="atm-screen-header">
        <div className="atm-screen-title">ENTER PIN</div>
        <div className="atm-screen-sub">CARD: ****{cardNumber.slice(-4)}</div>
      </div>
      <p className="atm-hint">Please enter your 4-digit PIN</p>
      <div className="pin-dots">
        {[0,1,2,3].map(i => (
          <div key={i} className={`pin-dot ${i < pinEntered.length ? 'pin-dot-filled' : ''}`} />
        ))}
      </div>
      <div className="numpad">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} className="num-key" onClick={() => enterPinDigit(String(n))}>{n}</button>
        ))}
        <button className="num-key num-key-clear" onClick={clearPinDigit}>CLR</button>
        <button className="num-key" onClick={() => enterPinDigit('0')}>0</button>
        <button className="num-key num-key-ok" onClick={verifyPin}>OK</button>
      </div>
      {message && <p className="atm-msg atm-msg-err">{message}</p>}
    </div>
  );

  const renderMenuScreen = () => (
    <div className="atm-screen-content">
      <div className="atm-screen-header">
        <div className="atm-screen-title" style={{color:'#66ffaa'}}>WELCOME</div>
      </div>
      <div className="atm-balance-label">AVAILABLE BALANCE</div>
      <div className="atm-balance-big">${balance.toLocaleString()}</div>
      <hr className="atm-sep" />
      <div className="btn-grid-2">
        <button className="atm-btn atm-btn-primary" onClick={getBalance}>💳 BALANCE</button>
        <button className="atm-btn atm-btn-warn" onClick={() => setScreen('withdraw')}>💵 WITHDRAW</button>
        <button className="atm-btn atm-btn-info" onClick={() => setScreen('deposit')}>📥 DEPOSIT</button>
        <button className="atm-btn atm-btn-purple" onClick={getHistory}>📋 HISTORY</button>
      </div>
      <button className="atm-btn atm-btn-danger" style={{marginTop:8}} onClick={logout}>⏏ EJECT CARD / LOGOUT</button>
      {message && <p className="atm-msg atm-msg-ok">{message}</p>}
    </div>
  );

  const renderBalanceScreen = () => (
    <div className="atm-screen-content" style={{textAlign:'center'}}>
      <div className="atm-screen-header">
        <div className="atm-screen-title">BALANCE INQUIRY</div>
        <div className="atm-screen-sub">{new Date().toLocaleString()}</div>
      </div>
      <div className="atm-balance-label" style={{marginTop:16}}>CURRENT BALANCE</div>
      <div className="atm-balance-big" style={{fontSize:32}}>${balance.toLocaleString()}</div>
      <div className="atm-footer-note" style={{marginTop:4}}>FUNDS AVAILABLE IMMEDIATELY</div>
      <button className="atm-btn atm-btn-primary" style={{marginTop:20}} onClick={() => setScreen('menu')}>◀ MAIN MENU</button>
    </div>
  );

  const renderWithdrawScreen = () => (
    <div className="atm-screen-content">
      <div className="atm-screen-header">
        <div className="atm-screen-title">WITHDRAWAL</div>
        <div className="atm-screen-sub">BALANCE: ${balance.toLocaleString()}</div>
      </div>
      <div className="atm-field-label">SELECT AMOUNT</div>
      <div className="btn-grid-3">
        {[20,40,60,80,100,200,300,500].map(amt => (
          <button
            key={amt}
            className={`atm-btn atm-btn-ghost ${amt > balance ? 'atm-btn-disabled' : ''}`}
            disabled={amt > balance}
            onClick={() => withdraw(amt)}
          >${amt}</button>
        ))}
      </div>
      <div className="atm-field-label" style={{marginTop:8}}>OTHER AMOUNT</div>
      <div style={{display:'flex',gap:6}}>
        <input className="atm-input" id="customAmt" type="number" placeholder="Enter amount" style={{flex:1,margin:0}} />
        <button className="atm-btn atm-btn-primary" style={{margin:'6px 0 0',padding:'6px 12px',whiteSpace:'nowrap'}}
          onClick={() => {
            const v = parseFloat(document.getElementById('customAmt').value);
            if (!v || v <= 0 || v % 10 !== 0) { setMessage('Must be a multiple of $10'); return; }
            if (v > balance) { setMessage('Insufficient funds'); return; }
            withdraw(v);
          }}>OK</button>
      </div>
      <button className="atm-btn atm-btn-ghost" style={{marginTop:6}} onClick={() => setScreen('menu')}>◀ CANCEL</button>
      {message && <p className="atm-msg atm-msg-err">{message}</p>}
    </div>
  );

  const renderDepositScreen = () => (
    <div className="atm-screen-content">
      <div className="atm-screen-header">
        <div className="atm-screen-title">DEPOSIT</div>
        <div className="atm-screen-sub">BALANCE: ${balance.toLocaleString()}</div>
      </div>
      <div className="atm-field-label" style={{marginTop:8}}>ENTER DEPOSIT AMOUNT</div>
      <input
        className="atm-input atm-input-center"
        type="number"
        placeholder="$0.00"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button className="atm-btn atm-btn-primary" style={{marginTop:8}} onClick={() => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { setMessage('Enter a valid amount'); return; }
        deposit(amt);
        setAmount('');
      }}>CONFIRM DEPOSIT</button>
      <button className="atm-btn atm-btn-ghost" style={{marginTop:4}} onClick={() => setScreen('menu')}>◀ CANCEL</button>
      {message && <p className="atm-msg atm-msg-err">{message}</p>}
    </div>
  );

  const renderHistoryScreen = () => (
    <div className="atm-screen-content">
      <div className="atm-screen-header">
        <div className="atm-screen-title">TRANSACTION HISTORY</div>
      </div>
      <div className="tx-list">
        {history.length === 0
          ? <p className="atm-msg atm-msg-warn">NO TRANSACTIONS FOUND</p>
          : [...history].reverse().map((t, i) => (
            <div key={i} className="tx-row">
              <span className={t.type === 'deposit' ? 'tx-dep' : 'tx-wd'}>
                {t.type === 'deposit' ? 'DEP' : 'WDL'} {new Date(t.date).toLocaleDateString()}
              </span>
              <span className={t.type === 'deposit' ? 'tx-dep' : 'tx-wd'}>
                {t.type === 'deposit' ? '+' : '-'}${t.amount}
              </span>
            </div>
          ))}
      </div>
      <button className="atm-btn atm-btn-primary" style={{marginTop:8}} onClick={() => setScreen('menu')}>◀ MAIN MENU</button>
    </div>
  );

  const renderRegisterScreen = () => (
    <div className="atm-screen-content">
      <div className="atm-screen-header">
        <div className="atm-screen-title">NEW CARD</div>
        <div className="atm-screen-sub">REGISTRATION</div>
      </div>
      <div className="atm-field-label">CARD NUMBER (4 digits)</div>
      <input className="atm-input atm-input-center" type="text" maxLength="4" placeholder="____" value={newCardNumber} onChange={e => setNewCardNumber(e.target.value)} />
      <div className="atm-field-label" style={{marginTop:6}}>PIN (4 digits)</div>
      <input className="atm-input atm-input-center" type="password" maxLength="4" placeholder="****" value={newPin} onChange={e => setNewPin(e.target.value)} />
      <button className="atm-btn atm-btn-primary" style={{marginTop:8}} onClick={registerCard}>REGISTER CARD</button>
      <button className="atm-btn atm-btn-ghost" style={{marginTop:4}} onClick={() => setScreen('insert')}>◀ CANCEL</button>
      {regMessage && <p className={`atm-msg ${regMessage.includes('registered') ? 'atm-msg-ok' : 'atm-msg-err'}`}>{regMessage}</p>}
    </div>
  );

  const renderDispensingScreen = () => (
    <div className="atm-screen-content" style={{textAlign:'center'}}>
      <div className="atm-screen-header">
        <div className="atm-screen-title" style={{color:'#ffcc44'}}>DISPENSING CASH</div>
      </div>
      <div style={{margin:'20px 0'}}>
        <div style={{fontSize:32,color:'#ffcc44',fontWeight:'bold'}}>${dispensingAmount}</div>
        <div style={{fontSize:10,color:'#886600',marginTop:6}}>PLEASE WAIT...</div>
        <div className="dispense-dots">
          {[0,1,2,3,4].map(i => <span key={i} className="dispense-dot" style={{animationDelay:`${i*0.15}s`}} />)}
        </div>
        <div style={{fontSize:9,color:'#446633',marginTop:12}}>DO NOT REMOVE CARD</div>
        <div style={{fontSize:9,color:'#446633',marginTop:2}}>COLLECT CASH FROM TRAY BELOW</div>
      </div>
    </div>
  );

  const renderSuccessScreen = () => (
    <div className="atm-screen-content" style={{textAlign:'center'}}>
      <div className="atm-screen-header">
        <div className="atm-screen-title" style={{color:'#44ff88'}}>TRANSACTION COMPLETE</div>
      </div>
      <div style={{margin:'14px 0'}}>
        <div style={{fontSize:28,marginBottom:8,color:'#44ff88'}}>✓</div>
        <div style={{fontSize:11,color:'#44ff88'}}>{successMsg}</div>
        <div className="atm-balance-label" style={{marginTop:12}}>NEW BALANCE</div>
        <div className="atm-balance-big">${balance.toLocaleString()}</div>
      </div>
      <button className="atm-btn atm-btn-primary" onClick={() => { setBills([]); setScreen('menu'); }}>◀ MAIN MENU</button>
      <button className="atm-btn atm-btn-danger" style={{marginTop:4}} onClick={logout}>⏏ EJECT CARD</button>
    </div>
  );

  const screens = {
    insert: renderInsertScreen,
    pin: renderPinScreen,
    menu: renderMenuScreen,
    balance: renderBalanceScreen,
    withdraw: renderWithdrawScreen,
    deposit: renderDepositScreen,
    history: renderHistoryScreen,
    register: renderRegisterScreen,
    dispensing: renderDispensingScreen,
    success: renderSuccessScreen,
  };

  const screenContent = screens[screen] ? screens[screen]() : <div>Unknown</div>;

  return (
    <div className="atm-page">
      <div className="atm-machine">

        {/* Top bar */}
        <div className="atm-topbar">
          <div className="atm-brand">SECURENET ATM</div>
          <div className="atm-lights">
            <div className="atm-light atm-light-green" />
            <div className="atm-light atm-light-amber" />
            <div className="atm-light atm-light-off" />
          </div>
        </div>

        {/* Card slot */}
        <div className="atm-card-slot-wrap">
          <div className="atm-card-slot-bar">
            <span className="atm-slot-label">CARD</span>
            <div className="atm-card-slot">
              <span className="atm-card-slot-text" style={{display: cardInserted ? 'none' : 'block'}}>INSERT CARD</span>
              {cardInserted && <div className="atm-card-visual"><div className="atm-card-chip" /></div>}
            </div>
          </div>
        </div>

        {/* Screen */}
        <div className="atm-bezel">
          <div className="atm-screen">
            <div className="atm-scanline" />
            {screenContent}
          </div>
        </div>

        {/* Cash dispenser */}
        <div className="atm-dispenser-wrap">
          <div className={`atm-dispenser-slot ${motorActive ? 'atm-motor-on' : ''}`}>
            {motorActive
              ? <div className="atm-rollers">{[0,1,2,3,4].map(i => <div key={i} className="atm-roller" />)}</div>
              : <span className="atm-slot-label">CASH DISPENSER</span>
            }
          </div>
          <div className="atm-tray">
            <div className="atm-tray-depth" />
            <span className="atm-tray-label">COLLECT YOUR CASH</span>
            <div className="atm-bill-container">
              {bills.map(b => (
                <div
                  key={b.id}
                  className="atm-bill"
                  style={{
                    '--rx': `${b.rx}px`,
                    '--rr': `${b.rr}deg`,
                    '--rrfinal': `${b.rrFinal}deg`,
                    '--ry': `${b.ry}px`,
                  }}
                >
                  <span className="bill-serial">A{Math.floor(Math.random()*99999999).toString().padStart(8,'0')}</span>
                  <div className="bill-inner">
                    <div className="bill-oval">$</div>
                    <div className="bill-lines">
                      <div className="bill-line" /><div className="bill-line" /><div className="bill-line" />
                    </div>
                  </div>
                  <div className="bill-strip" />
                  <span className="bill-denom">${b.denom}</span>
                </div>
              ))}
            </div>
            <div className="atm-tray-lip" />
          </div>
        </div>

        {/* Receipt slot */}
        <div className="atm-receipt-slot-wrap">
          <div className="atm-receipt-slot"><span className="atm-slot-label">RECEIPT</span></div>
        </div>
        {receiptVisible && receiptData && (
          <div className="atm-receipt">
            <div className="atm-receipt-text">
              SECURENET ATM<br/>
              {'─'.repeat(22)}<br/>
              {receiptData.date}<br/>
              CARD: ****{receiptData.cardNumber.slice(-4)}<br/>
              {'─'.repeat(22)}<br/>
              {receiptData.type}: ${receiptData.amt}<br/>
              BALANCE: ${receiptData.newBal?.toLocaleString()}<br/>
              {'─'.repeat(22)}<br/>
              THANK YOU
            </div>
          </div>
        )}

        {/* Bottom */}
        <div className="atm-bottom">
          <span className="atm-version">v4.2.1 · EMV · NFC</span>
          <div className="atm-sec-dots">{[0,1,2,3].map(i => <div key={i} className="atm-sec-dot" />)}</div>
        </div>
      </div>
    </div>
  );
}

export default App;