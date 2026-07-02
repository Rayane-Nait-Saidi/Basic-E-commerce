import './SignUp.css';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';
import { BASE_URL } from "./api" ;

interface UserForm {
  username: string;
  email: string;
  password: string;
}

const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
const digits = '0123456789'.split('');
const specialSymbols = '!@#$%^&*()-_=+[]{}\\|;:\'",.<>/?`~'.split('');

function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState<UserForm>({ username: '', email: '', password: '' });
  const [strength , setStrength] = useState<string>("weak") ;
  const [loading , setLoading] = useState<boolean>(false) ;
  const [msg , setMsg] = useState<string>("") ;

  const handleUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 30)
      setForm({ ...form, username: e.target.value });
  };

  const handleEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 60)
      setForm({ ...form, email: e.target.value });
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 16)
      setForm({ ...form, password: e.target.value });
  };

  const handleCreate = async ():Promise<void> => {
    setLoading(true) ; setForm({username:"" , email:"" , password:""}); setMsg("") ;
    try{
      await fetch(`${BASE_URL}/logs/register`,{
        method:"POST",
        credentials:"include",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({username : form.username , email:form.email , password:form.password})
      })
      .then(res => res.json())
      .then(data => {
          if (data.succ){
             navigate(`/verify/${data.id}` , {state:{email:data.email}}) ;
          }else{
             setMsg("something went wrong!");
          }
      })
    }catch(e){
        setMsg("something went wrong!");
    }finally{
        setLoading(false) ;
    }
  }
  
  
  const teststrength = (text:string):boolean => {
    let i=0 ; 
    let b = false ; 
    //check alpha
    while (i<alphabets.length && !b){
      if (text.includes(alphabets[i])){
        b = true ;
      }else{
        i++
      }
    }
 
    //check digits
    i = 0 ; 
    let c = false ;
    while (i<digits.length && !c){
      if (text.includes(digits[i])){
        c = true ;
      }else{
        i++
      }
    }

    //check specials chars 
    i = 0 ;
    let d = false ; 
    while (i<specialSymbols.length && !d){
      if (text.includes(specialSymbols[i])){
        d = true ; 
      }
      else{
        i++;
      }
    }

    if (text.length < 8 || !b || !c || !d){
      return false ;
    }else{
      return true ;
    }

  }

  useEffect(() => {
     if (teststrength(form.password)){
      setStrength("strong");
     }else{
      setStrength("weak");
     }
  },[form.password])


  return (
    <div className="signup-page">
      <div className="signup-card">

        <div className="signup-logo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1>Create account</h1>
        <p className="signup-subtitle">Join us today, it's free</p>

        <div className="input-field">
          <label htmlFor="username">Username</label>
          <div className="input-wrap">
            <HiOutlineUser className="input-icon" />
            <input
              id="username"
              type="text"
              placeholder="your username"
              value={form.username}
              onChange={handleUsername}
            />
            <span className="counter">{form.username.length}/30</span>
          </div>
        </div>

        <div className="input-field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <HiOutlineEnvelope className="input-icon" />
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleEmail}
            />
            <span className="counter">{form.email.length}/60</span>
          </div>
        </div>

        <div className="input-field">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <HiOutlineLockClosed className="input-icon" />
            <input
              id="password"
              type="password"
              placeholder="your password"
              value={form.password}
              onChange={handlePassword}
            />
            <span className="counter">{form.password.length}/16</span>
          </div>
          <label ><li style={{marginLeft:"10px"}}>you must provide a strong password</li></label>
          <label ><li style={{marginLeft:"10px"}}>use numbers , chars and symbols</li></label>
          <label ><li style={{marginLeft:"10px" , color:`${strength === 'weak' ? 'red' : 'green'}`}}>your password is : {strength}</li></label>
        </div>

        <button type="submit" disabled={!form.username || !form.email || !form.password || loading || strength === 'weak'} onClick={handleCreate}>
          {loading == false && "Sign Up"}
          {loading == true && <div className="spinner"></div>}
        </button>

        {msg && <p className="message" style={{textAlign:"center" , color:"orangered"}}>{msg}</p>}

        <div className="divider"><span>or</span></div>

        <p className="signin-link">
          Already have an account? <a onClick={() => navigate('/signin')}>Sign in</a>
        </p>

      </div>
    </div>
  );
}

export default SignUp;