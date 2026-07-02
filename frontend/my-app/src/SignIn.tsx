import './SignIn.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';
import { BASE_URL } from "./api" ;

interface User {
  email: string;
  password: string;
}

function SignIn() {
  const [user, setUser] = useState<User>({ email: '', password: '' });
  const [loading , setLoading] = useState<boolean>(false) ; 
  const navigate = useNavigate();
  const [msg , setMsg] = useState<string>("") ;
  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>):void => {
    if (e.target.value.length <= 60) {
      setUser({ ...user, email: e.target.value });
    }
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>):void => {
    if (e.target.value.length <= 16) {
      setUser({ ...user, password: e.target.value });
    }
  };

  const handleSubmit = async():Promise<void> => {
    try{
      setLoading(true) ; setUser({email:"" , password:""}) ; setMsg("");
      await fetch(`${BASE_URL}/logs/login`,{
         method:"POST",
         credentials:"include",
         headers:{"Content-Type":"application/json"},
         body:JSON.stringify({email:user.email , password:user.password})
      })
      .then(res => res.json())
      .then(data => {
         if (data.succ){
            if (data.role === "admin") {
              navigate(`/dashboardadmin/${data.id}`) ;
            } else {
              navigate(`/dashboard/${data.id}`) ;
            }
         }
         else{
            setMsg("Invalid email or password!") ;
            setTimeout(() => {
              setMsg("");
            },3000);  
         }
      });


    }catch(e){
      setMsg("something went wrong!");
      setTimeout(() => {
              setMsg("");
            },3000); 
    }finally{
      setLoading(false) ;
    }
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Welcome back</h1>
        <p className="signin-subtitle">Sign in to continue</p>

        <div className="input-field">
          <label htmlFor="username">Email</label>
          <div className="input-wrap">
            <span className="input-icon"><HiOutlineEnvelope size={16} /></span>
            <input
              id="username"
              type="text"
              placeholder="your email"
              value={user.email}
              onChange={handleEmail}
            />
            <h2>{user.email.length}/60</h2>
          </div>
        </div>

        <div className="input-field">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <span className="input-icon"><HiOutlineLockClosed size={16} /></span>
            <input
              id="password"
              type="password"
              placeholder="your password"
              value={user.password}
              onChange={handlePassword}
            />
            <h2>{user.password.length}/16</h2>
          </div>
        </div>

        <div className="forgot-row">
          <a onClick={() => navigate('/forgetpassword')} style={{ cursor: 'pointer' }}>Forgot your password?</a>
        </div>

        <button type="submit" disabled={!user.email || !user.password || loading || user.password.length < 8} onClick={handleSubmit}>
          {loading == false && "sing in"}
          {loading == true && 
             <div className="spinner"></div>
          }
        </button>
        {msg && <p className="error-message" style={{textAlign:"center" , color:"orangered"}}>{msg}</p>}
        <div className="divider"><span>or</span></div>

        <p className="register-link">
          Don't have an account? <a onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>Register</a>
        </p>
      </div>
    </div>
  );
}

export default SignIn;