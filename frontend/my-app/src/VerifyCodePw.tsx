import './VerifyCodePw.css';
import { useState, useRef, useEffect } from 'react';
import { useNavigate , useLocation} from 'react-router-dom';
import { BASE_URL } from './api';

const CODE_LENGTH = 6;
const RESEND_DELAY = 60;

function VerifyCodePw() {
  const navigate = useNavigate();
  const location = useLocation() ;
  const email = location.state?.email || "" ;
  const [emailState, setEmailState] = useState<string>(email) ;
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [timer, setTimer] = useState<number>(RESEND_DELAY);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [msg , setMsg] = useState<string>("") ;
  const [loading , setLoading] = useState<boolean>(false) ;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (email){
        setEmailState(email) ;
    }
  },[]) ;

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...digits];
    updated[index] = value.slice(-1);
    setDigits(updated);
    if (value && index < CODE_LENGTH - 1)
      inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      inputsRef.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    const updated = [...digits];
    pasted.split('').forEach((char, i) => { updated[i] = char; });
    setDigits(updated);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleVerify = async(): Promise<void> => {
    try{
        setLoading(true); setMsg("") ;
        const code = digits.join('');
        await fetch(`${BASE_URL}/logs/checkcode`,{
          method:"POST",
          credentials:"include",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({email:emailState , code:code})
        })
        .then(res => res.json())
        .then(data => {
          if (data.succ){
              navigate(`/resetpassword/${data.id}` , {state:{email:emailState}}) ;
          }else{
              setMsg(data.error) ;
              setTimeout(() => {
                setMsg("") ;
              }, 3000) ;
          }
        })
    }catch(e){
        setMsg("something went wrong!") ;
        setTimeout(() => {
            setMsg("") ;
        }, 3000) ;
    }finally{
        setLoading(false) ;
    }
  };

  const handleResend = async():Promise<void> => {
    // TODO: your logic here
    try{
        setLoading(true); setMsg("") ;
        await fetch(`${BASE_URL}/logs/resetcode`,{
          method:"PUT",
          credentials:"include",
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: emailState })
        })
        .then(res => res.json())
        .then(data => {

          if (data.succ){
              setTimer(RESEND_DELAY);
              setCanResend(false);
              setMsg("Code resent successfully!") ;
              setTimeout(() => {
                setMsg("") ;
              }, 3000) ;  
          }else{
              setMsg(data.error) ;
              setTimeout(() => {
                setMsg("") ;
              }, 3000) ;
          }
        })


    }catch(e){
        setMsg("something went wrong!") ;
        setTimeout(() => {
            setMsg("") ;
        }, 3000) ;
    }finally{
        setLoading(false) ;
    }
  };

  return (
    <div className="vcpw-page">
      <div className="vcpw-card">

        <div className="vcpw-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Check your email</h1>
        <p className="vcpw-subtitle">
          We sent a 6-digit code to reset your password to<br />
          <span>{emailState}</span>
        </p>

        <div className="code-boxes">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputsRef.current[i] = el; }}
              className="code-box"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
            />
          ))}
        </div>

        <button
          className="btn-fill"
          onClick={handleVerify}
          disabled={digits.join('').length < CODE_LENGTH}
        >
          Verify code
        </button>

        <button
          className="btn-outline"
          onClick={handleResend}
          disabled={!canResend || loading}
        >
          {!loading && "Resend code"}
          {loading && 
             <div className="spinner"></div>
          }
        </button>

        {msg && <p className="vcpw-msg" style={{textAlign:"center"}}>{msg}</p>}

        {!canResend && (
          <p className="timer-row">
            Resend available in <span>{timer}s</span>
          </p>
        )}

      </div>
    </div>
  );
}

export default VerifyCodePw;