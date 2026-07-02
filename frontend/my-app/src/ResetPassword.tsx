import './ResetPassword.css';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import { BASE_URL } from './api';

const alphabets     = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
const digits        = '0123456789'.split('');
const specialSymbols = '!@#$%^&*()-_=+[]{}\\|;:\'",.<>/?`~'.split('');

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [password, setPassword]       = useState<string>('');
  const [confirm, setConfirm]         = useState<string>('');
  const [showPass, setShowPass]       = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [loading, setLoading]         = useState<boolean>(false);
  const [msg, setMsg]                 = useState<string>('');
  const [isError, setIsError]         = useState<boolean>(false);
  const [strength, setStrength]       = useState<string>('weak');
  const [emailState, setEmailState]       = useState<string>(email);

  useEffect(() => {
      if (email){
          setEmailState(email) ;
      }
  },[]);

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 16) setPassword(e.target.value);
  };

  const handleConfirm = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 16) setConfirm(e.target.value);
  };

  // --- your exact algorithm from SignUp.tsx ---
  const teststrength = (text: string): boolean => {
    let i = 0;
    let b = false;
    while (i < alphabets.length && !b) {
      if (text.includes(alphabets[i])) { b = true; } else { i++; }
    }

    i = 0;
    let c = false;
    while (i < digits.length && !c) {
      if (text.includes(digits[i])) { c = true; } else { i++; }
    }

    i = 0;
    let d = false;
    while (i < specialSymbols.length && !d) {
      if (text.includes(specialSymbols[i])) { d = true; } else { i++; }
    }

    if (text.length < 8 || !b || !c || !d) { return false; }
    else { return true; }
  };

  useEffect(() => {
    if (teststrength(password)) {
      setStrength('strong');
    } else {
      setStrength('weak');
    }
  }, [password]);
  // ---------------------------------------------

  const passwordsMatch  = confirm.length > 0 && password === confirm;
  const passwordsDiffer = confirm.length > 0 && password !== confirm;
  const canSubmit       = strength === 'strong' && passwordsMatch && !loading;

  const handleSubmit = async (): Promise<void> => {
     try{
         setLoading(true);setMsg(""); setIsError(false) ;
         await fetch(`${BASE_URL}/logs/resetpassword`,{
           method:"POST",
           credentials:"include",
           headers:{"Content-Type":"application/json"},
           body:JSON.stringify({email:emailState , password:password , confirm:confirm})
         })
         .then(res => res.json())
         .then(data => {
            if (data.succ){
                setMsg("password reset successfully! you will be redirected to login page in 3 seconds") ;
                setTimeout(() => {
                  navigate("/signin") ;
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
    <div className="rp-page">
      <div className="rp-card">

        <div className="rp-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Reset password</h1>
        <p className="rp-subtitle">Choose a new password for your account.</p>

        {/* New password */}
        <div className="input-field">
          <label htmlFor="password">New password</label>
          <div className="input-wrap">
            <HiOutlineLockClosed className="input-icon" />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              placeholder="new password"
              value={password}
              onChange={handlePassword}
            />
            <span className="counter">{password.length}/16</span>
            <button className="eye-btn" onClick={() => setShowPass(p => !p)}>
              {showPass ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
            </button>
          </div>
          {/* same labels as SignUp.tsx */}
          <label><li style={{ marginLeft: '10px' }}>you must provide a strong password</li></label>
          <label><li style={{ marginLeft: '10px' }}>use numbers, chars and symbols</li></label>
          {password.length > 0 && (
            <label>
              <li style={{ marginLeft: '10px', color: strength === 'weak' ? 'red' : 'green' }}>
                your password is : {strength}
              </li>
            </label>
          )}
        </div>

        {/* Confirm password */}
        <div className="input-field">
          <label htmlFor="confirm">Confirm password</label>
          <div className="input-wrap">
            <HiOutlineLockClosed className="input-icon" />
            <input
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              placeholder="confirm password"
              value={confirm}
              onChange={handleConfirm}
              className={passwordsMatch ? 'match' : passwordsDiffer ? 'no-match' : ''}
            />
            <button className="eye-btn" onClick={() => setShowConfirm(p => !p)}>
              {showConfirm ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
            </button>
          </div>
          {passwordsMatch  && <p className="hint ok">✓ Passwords match</p>}
          {passwordsDiffer && <p className="hint err">✗ Passwords do not match</p>}
        </div>

        {msg && (
          <p className={`rp-msg ${isError ? 'rp-msg--err' : 'rp-msg--ok'}`} style={{ color:"red" }}>{msg}</p>
        )}

        <button
          className="btn-fill"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? <div className="spinner"></div> : 'Reset password'}
        </button>

      </div>
    </div>
  );
}

export default ResetPassword;