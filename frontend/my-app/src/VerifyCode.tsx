import './VerifyCode.css';
import { useState, useRef, useEffect } from 'react';
import { useNavigate , useLocation} from 'react-router-dom';
import { BASE_URL } from "./api" ;

const CODE_LENGTH = 6;

function VerifyCode() {
  const navigate = useNavigate();
  const location = useLocation() ;
  const email = location.state?.email || "" ; // get email from state or default to empty string
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [emailState, setEmailState] = useState<string>(email) ; // state to hold email
  const [msg , setMsg] = useState<string>("") ;
  const [loading , setLoading] = useState<boolean>(false) ;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
     if (email){
        setEmailState(email) ; // set email state if email is available
     }
  },[]) ;

  
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;               // digits only
    const updated = [...digits];
    updated[index] = value.slice(-1);               // keep last char
    setDigits(updated);
    if (value && index < CODE_LENGTH - 1)
      inputsRef.current[index + 1]?.focus();        // auto-advance
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0)
      inputsRef.current[index - 1]?.focus();        // go back on delete
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    const updated = [...digits];
    pasted.split('').forEach((char, i) => { updated[i] = char; });
    setDigits(updated);
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  };

  const handleVerify = async():Promise<void> => {
    // TODO: call your verify API here
    try{
        const code = digits.join('');
        setLoading(true); setMsg("") ;
        await fetch(`${BASE_URL}/logs/verifycode`,{
          method:"POST",
          credentials:"include",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({email:emailState , code:code})
        })
        .then(res => res.json())
        .then(data => {
          if (!data.succ){
             setMsg("Invalid code. Please try again.") ;
             setTimeout(() => {
                setMsg("") ;
             }, 3000) ;
          }else{
             navigate(`/dashboard/${data.id}`) ;
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
    
    // TODO: call your resend API here
    try{
       setLoading(true); setMsg("");
       setDigits(Array(CODE_LENGTH).fill(''));
       inputsRef.current[0]?.focus();
       await fetch(`${BASE_URL}/logs/resend`,{
          method:"PUT",
          credentials:"include",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({email:emailState})
       })
       .then(res => res.json())
       .then(data => {
          if (data.succ){
             setMsg("code resent successfully!") ;
             setTimeout(() => {
                setMsg("") ;
             }, 3000) ;
          }else{
              setMsg("something went wrong!") ;
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
    <div className="verify-page">
      <div className="verify-card">

        <div className="verify-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Check your email</h1>
        <p className="verify-subtitle">
          We sent a 6-digit code to<br />
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
          disabled={digits.join('').length < CODE_LENGTH || loading}
        >
          {!loading && "Verify code"}
          {loading && 
             <div className="spinner"></div>
          }
        </button>

        <button
          className="btn-outline"
          onClick={handleResend}
          disabled={loading}
        >
          {!loading && "Resend code"}
          {loading && 
             <div className="spinner"></div>
          }
        </button>
        
        {msg && <p className="message" style={{textAlign:"center" , color:"orangered"}}>{msg}</p>}

      </div>
    </div>
  );
}

export default VerifyCode;