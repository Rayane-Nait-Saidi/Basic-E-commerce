import './ForgetPassword.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineEnvelope } from 'react-icons/hi2';
import { BASE_URL } from './api';

function ForgetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 60)
      setEmail(e.target.value);
  };

  const handleSubmit = async () => {
    try{
        setLoading(true); setError(''); setEmail('') ;
        await fetch(`${BASE_URL}/logs/forgetpassword`,{
            method:"POST",
            credentials:"include",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({email:email})
        })
        .then(res => res.json())
        .then(data => {
            if (data.succ){
                navigate(`/verifycodepw/${data.id}` , {state:{email:email}}) ;
            }else{
                setError("Invalid email!") ;
                setTimeout(() => {
                    setError("") ;
                },3000) ;
            }
        })
    }catch(e){
        setError("An error occurred. Please try again.") ;
        setTimeout(() => {
            setError("") ;
        },3000) ;
    }finally{
        setLoading(false) ;
    }
  };

  return (
    <div className="fp-page">
      <div className="fp-card">

        <div className="fp-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Forgot password?</h1>
        <p className="fp-subtitle">
          Enter your email and we'll send you a verification code to reset your password.
        </p>

        <div className="input-field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <HiOutlineEnvelope className="input-icon" />
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={handleEmail}
            />
            <span className="counter">{email.length}/60</span>
          </div>
        </div>

        {error && <p className="fp-error">{error}</p>}

        <button
          className="btn-fill"
          onClick={handleSubmit}
          disabled={!email || loading}
        >
          {!loading && 'Send Verification Code'}
          {loading && <div className="spinner"></div>}

        </button>

        <div className="divider"><span>or</span></div>

        <p className="back-link">
          Remembered it? <a onClick={() => navigate('/signin')}>Sign in</a>
        </p>

      </div>
    </div>
  );
}

export default ForgetPassword;