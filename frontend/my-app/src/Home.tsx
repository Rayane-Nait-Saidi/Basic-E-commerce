import './Home.css';
import { useNavigate } from 'react-router-dom';
import { useEffect , useState } from 'react';
import { BASE_URL } from "./api" ;
function Home() {
  const navigate = useNavigate();
  const [isLoggedIn , setIsLoggedIn] = useState<boolean>(true) ;
  const [switched , setSwitched] = useState<boolean>(false) ;

  useEffect(() => {
  //call the switch account API to check if the user is logged in or not
  const check = async (): Promise<void> => {
    try {
      setIsLoggedIn(true);
      
      const response = await fetch(`${BASE_URL}/switchaccount`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await response.json();
      
      if (data.succ) {
        navigate(`/dashboard/${data.id}`);
        setSwitched(true);
      } else {
        //try to refresh the token
        const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });
        
        const refreshData = await refreshResponse.json();
        
        if (refreshData.succ) {
          //refresh successful, let's retry the switch account API
          const retryResponse = await fetch(`${BASE_URL}/switchaccount`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
          });
          
          const retryData = await retryResponse.json();
          
          if (retryData.succ) {
            navigate(`/dashboard/${retryData.id}`);
            setSwitched(true);
          } else {
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      }
    } catch (e) {
      console.error("Error during authentication check:", e);
      setIsLoggedIn(false);
    }
  };

  check();
}, []);

  if (isLoggedIn){
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Checking your account...</p>
      </div>
    )
  }
 
  if (isLoggedIn === false && switched === false){
  return (
    <div className="home-page">

      <nav className="navbar">
        <div className="nav-logo">
          <div className="logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={{fontSize:"1rem"}}>E-commerce</span>
        </div>
        <div className="nav-buttons">
          <button className="btn-outline" onClick={() => navigate('/signin')}>Sign in</button>
          <button className="btn-outline" onClick={() => navigate('/signup')}>Sign up</button>
        </div>
      </nav>

      <section className="hero">
        <h1>Shop everything, <span>all in one place</span></h1>
        <p>Discover thousands of products across every category — delivered fast, priced right.</p>
      </section>

      <section className="features">
        <div className="feat-card">
          
          <h3>Fast delivery</h3>
          <p>Get your orders in 24–48 hours</p>
        </div>
        <div className="feat-card">
          
          <h3>Secure payment</h3>
          <p>Your data is always protected</p>
        </div>
        <div className="feat-card">
          
          <h3>Easy returns</h3>
          <p>30-day hassle-free return policy</p>
        </div>
        <div className="feat-card">
         
          <h3>Top rated</h3>
          <p>Thousands of 5-star reviews</p>
        </div>
      </section>

    </div>
  );
}

}

export default Home;