import './DashBoard.css';
import { HiOutlineBars3, HiOutlineClipboardDocumentList, HiOutlineMagnifyingGlass, HiOutlineUser } from 'react-icons/hi2';
import { useState, useEffect } from 'react';
import { BASE_URL } from "./api";
import Cookies from "js-cookie";
import { useNavigate } from 'react-router-dom';

function DashBoard() {

  const [username, setUsername] = useState<string>('');
  const [productsList, setProductsList] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [ordering, setOrdering] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);
  const [checked , setChecked] = useState<boolean>(false);
  const [isLoggedIn , setIsLoggedIn] = useState<boolean>(true) ;
  const [searchby , setSearchby] = useState<string>("Name") ;
  const [searchquery , setSearchquery] = useState<string>("") ;
  const [searching , setSearching] = useState<boolean>(false) ;
  const [userId , setUserId] = useState<string>("") ;
  const navigate = useNavigate() ;

  useEffect(() => {
    document.body.style.overflow = selectedProduct || isSidebarOpen || isLogoutModalOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedProduct, isSidebarOpen, isLogoutModalOpen]);

  useEffect(() => {
     const fetchProfile = async():Promise<void> => {
      try{
          const response = await fetch(`${BASE_URL}/client/profile`,{
            method:"GET",
            credentials:"include",
            headers:{"Content-Type":"application/json"}
          }) ;
          const data = await response.json() ;
          if (data.succ){
            setUsername(data.username) ;
            setProductsList(data.productsList) ;
            setUserId(data.userId) ;
            setChecked(true) ;
          }else if (data.error === "unauthorized!"){
            //we need to refresh the token and retry
            const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" }
            });
            const refreshData = await refreshResponse.json();
            if (refreshData.succ) {
              setIsLoggedIn(true) ;
              //refresh successful , retry the profile API
              const retryResponse = await fetch(`${BASE_URL}/client/profile`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
              });
              const retryData = await retryResponse.json(); 
              if (retryData.succ) {
                setUsername(retryData.username);
                setProductsList(retryData.productsList);
                setUserId(retryData.userId) ;
                setChecked(true);
              }else{
                setIsLoggedIn(false) ;
              }
            }else{
                setIsLoggedIn(false) ;
            }
          }else{
            setIsLoggedIn(false) ;
          }

      }catch(e){
        console.error("Error fetching profile:", e);
        setIsLoggedIn(false) ;
      }
    }

    fetchProfile() ;
  },[]);


  /*const handleSearch = async ():Promise<void> => {
      try{
          setSearching(true) ;
          const csrfToken = Cookies.get("csrfToken") ;
          const response = await fetch(`${BASE_URL}/client/search`,{
            method:"POST",
            credentials:"include",
            headers:{"Content-Type":"application/json" , "x-csrf-token": csrfToken||""},
            body: JSON.stringify({searchby, searchquery})
          }) ;
          const data = await response.json() ;
          if (data.succ){
            setProductsList(data.productsList) ;
          }
      }catch(e){
        console.error("Error searching products:", e);
      }finally{
        setSearching(false);
      }

      setSearching(true) ;
  }*/

  /*useEffect(() => {
      const handleSearch = async():Promise<void> => {
         try{
            setSearching(true) ;
            const csrfToken = Cookies.get("csrfToken") ;
            const response = await fetch(`${BASE_URL}/client/search`,{
              method:"POST",
              credentials:"include",
              headers:{"Content-Type":"application/json" , "x-csrf-token": csrfToken||""},
              body: JSON.stringify({searchby, searchquery})
            }) ;
            const data = await response.json() ;
            if (data.succ){
              setProductsList(data.productsList) ;
            }else if (data.error === "unauthorized!" || data.error === "invalid CSRF token!"){
              //refresh now
              const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
              });
              const refreshData = await refreshResponse.json();
              if (refreshData.succ) {
                //refresh successful , retry the search API
                const csrfToken2 = Cookies.get("csrfToken") ;
                const retryResponse = await fetch(`${BASE_URL}/client/search`, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" , "x-csrf-token": csrfToken2||""},
                  body: JSON.stringify({searchby, searchquery})
                });
                const retryData = await retryResponse.json();
                if (retryData.succ) {
                  setProductsList(retryData.productsList);
                }
              }
            }
         }catch(e){
            console.error("Error searching products:", e);
         }finally{
            setSearching(false);
         }   
      }

      handleSearch() ;
  },[searchby , searchquery , isLoggedIn , checked]) ;*/

  const handleSearch = async():Promise<void> => {
         try{
            setSearching(true) ;
            const csrfToken = Cookies.get("csrfToken") ;
            const response = await fetch(`${BASE_URL}/client/search`,{
              method:"POST",
              credentials:"include",
              headers:{"Content-Type":"application/json" , "x-csrf-token": csrfToken||""},
              body: JSON.stringify({searchby, searchquery})
            }) ;
            const data = await response.json() ;
            if (data.succ){
              setProductsList(data.productsList) ;
            }else if (data.error === "unauthorized!" || data.error === "invalid CSRF token!"){
              //refresh now
              const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
              });
              const refreshData = await refreshResponse.json();
              if (refreshData.succ) {
                //refresh successful , retry the search API
                const csrfToken2 = Cookies.get("csrfToken") ;
                const retryResponse = await fetch(`${BASE_URL}/client/search`, {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" , "x-csrf-token": csrfToken2||""},
                  body: JSON.stringify({searchby, searchquery})
                });
                const retryData = await retryResponse.json();
                if (retryData.succ) {
                  setProductsList(retryData.productsList);
                }
              }else{
                setIsLoggedIn(false) ;
              }
            }
         }catch(e){
            console.error("Error searching products:", e);
         }finally{
            setSearching(false);
         }   
      }

  const handleOpenProduct = (product: any): void => {
    setOrderQuantity(1) ;
    setSelectedProduct(product) ;
  }

  const handleCloseProduct = (): void => {
    setSelectedProduct(null) ;
  }

  const handleOpenSidebar = (): void => {
    setIsSidebarOpen(true) ;
  }

  const handleCloseSidebar = (): void => {
    setIsSidebarOpen(false) ;
  }

  const handleOpenLogoutModal = (): void => {
    setIsSidebarOpen(false) ;
    setIsLogoutModalOpen(true) ;
  }

  const handleCloseLogoutModal = (): void => {
    if (loggingOut) {
      return ;
    }

    setIsLogoutModalOpen(false) ;
  }

  const handleLogout = async (): Promise<void> => {
    if (loggingOut) {
      return ;
    }

    const submitLogout = async (): Promise<Response> => {
      return fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      }) ;
    } ;

    try {
      setLoggingOut(true) ;

      let response = await submitLogout() ;
      let data = await response.json() ;

      if (data.succ) {
        setIsLogoutModalOpen(false) ;
        setIsSidebarOpen(false) ;
        navigate("/", { replace: true }) ;
        return ;
      }

      if (data.error === "unauthorized!") {
        const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        }) ;
        const refreshData = await refreshResponse.json() ;

        if (refreshData.succ) {
          response = await submitLogout() ;
          data = await response.json() ;

          if (data.succ) {
            setIsLogoutModalOpen(false) ;
            setIsSidebarOpen(false) ;
            navigate("/", { replace: true }) ;
            return ;
          }
        } else {
          setIsLoggedIn(false) ;
          return ;
        }
      }

      if (data.error) {
        console.error("Logout failed:", data.error) ;
      }
    } catch (error) {
      console.error("Error logging out:", error) ;
    } finally {
      setLoggingOut(false) ;
    }
  }

  const handleOrderNow = async (): Promise<void> => {
    if (!selectedProduct || selectedProduct.stock <= 0 || ordering) {
      return ;
    }

    const submitOrder = async (csrfToken: string): Promise<Response> => {
      return fetch(`${BASE_URL}/client/order`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken
        },
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity: orderQuantity
        })
      });
    };

    try {
      setOrdering(true) ;

      const csrfToken = Cookies.get("csrfToken") || "" ;
      let response = await submitOrder(csrfToken) ;
      let data = await response.json() ;

      if (data.succ) {
        const updatedStock = Math.max(0, selectedProduct.stock - orderQuantity) ;
        setProductsList((previousProducts) =>
          previousProducts.map((product) =>
            product._id === selectedProduct._id
              ? { ...product, stock: updatedStock }
              : product
          )
        ) ;
        handleCloseProduct() ;
        return ;
      }

      if (data.error === "unauthorized!" || data.error === "invalid CSRF token!") {
        const refreshResponse = await fetch(`${BASE_URL}/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        }) ;
        const refreshData = await refreshResponse.json() ;

        if (refreshData.succ) {
          const refreshedCsrfToken = Cookies.get("csrfToken") || "" ;
          response = await submitOrder(refreshedCsrfToken) ;
          data = await response.json() ;

          if (data.succ) {
            const updatedStock = Math.max(0, selectedProduct.stock - orderQuantity) ;
            setProductsList((previousProducts) =>
              previousProducts.map((product) =>
                product._id === selectedProduct._id
                  ? { ...product, stock: updatedStock }
                  : product
              )
            ) ;
            handleCloseProduct() ;
            return ;
          }

          if (data.error === "insufficient stock!") {
            setSelectedProduct({ ...selectedProduct, stock: 0 }) ;
          }
        } else {
          setIsLoggedIn(false) ;
        }
        return ;
      }

      if (data.error === "insufficient stock!") {
        setSelectedProduct({ ...selectedProduct, stock: 0 }) ;
      }
    } catch (e) {
      console.error("Error creating order:", e) ;
    } finally {
      setOrdering(false) ;
    }
  }

  
  if (!checked && isLoggedIn) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="error-screen">
        <h2>Access Denied</h2>
        <p>You are not logged in... retry again!!</p>
      </div>
    );
  }


  if (checked && isLoggedIn) {
  return (
    <div className="dashboard-page">

      <nav className="navbar">
        <div className="nav-logo">
          <div className="logo-mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span>Welcome : {username}</span>
        </div>
        <button className="menu-btn" type="button" onClick={handleOpenSidebar} aria-label="Open navigation menu">
          <HiOutlineBars3 />
        </button>
      </nav>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={handleCloseSidebar}>
          <aside className="right-sidebar" onClick={(event) => event.stopPropagation()}>
            <div className="sidebar-header">
              <span className="sidebar-title">Menu</span>
              <button className="sidebar-close" type="button" onClick={handleCloseSidebar} aria-label="Close navigation menu">
                ×
              </button>
            </div>

            <div className="sidebar-actions">
              <button className="sidebar-action-btn" type="button" onClick={() => navigate(`/dashboard/orders/${userId}`)}>
                <div className="avatar avatar-orders"><HiOutlineClipboardDocumentList /></div>
                <span>See Orders</span>
              </button>

              <button className="sidebar-action-btn" type="button" onClick={handleOpenLogoutModal}>
                <div className="avatar"><HiOutlineUser /></div>
                <span>Log Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {isLogoutModalOpen && (
        <div className="logout-modal-overlay" onClick={handleCloseLogoutModal}>
          <div className="logout-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Are you sure you wanna logout?</h3>
            <p>You will be signed out and sent back to the home page.</p>

            <div className="logout-modal-actions">
              <button className="logout-cancel-btn" type="button" onClick={handleCloseLogoutModal} disabled={loggingOut}>
                Cancel
              </button>
              <button className="logout-confirm-btn" type="button" onClick={handleLogout} disabled={loggingOut}>
                {loggingOut ? <span className="logout-spinner" aria-label="Logging out" /> : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="search-section">
        <div className="search-bar">
          <select className="search-select" value={searchby} onChange={(e) => setSearchby(e.target.value)}>
            <option value="Name" >Name</option>
            <option value="Category">Category</option>
          </select>
          <div className="search-input-wrap">
            <HiOutlineMagnifyingGlass className="search-icon" />
            <input className="search-input" type="text" placeholder="Search products..." value={searchquery} onChange={(e) => setSearchquery(e.target.value)} />
          </div>
          <button className="search-btn" onClick={handleSearch} disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </div>
      </section>

      <section className="products-section">
        <h2 className="section-title">Products</h2>

        {/* TODO: replace with mapped product cards once backend is ready */}
       { productsList.length == 0 && 
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No products found</h3>
          <p>Try adjusting your search or check back later</p>
        </div>
      }

      {searching && 
        <div className="empty-state">
           <div className="spinner"></div>
           <p>Loading...</p>
        </div>
      }

      { productsList.length > 0 && !searching &&

        <div className="products-grid">
            {
              productsList.map((product , i) => (
                <div className="product-card" key={i} onClick={() => handleOpenProduct(product)}>
                  <div className="product-img">
                    <img src={product.image} alt={product.name} />
                  </div>
                  
                  <div className="product-info">
                    <div className="product-name">{product.name}</div>
                    <div className="product-cat">{product.category}</div>
                    <div className="product-price">{product.price.toFixed(2)}DA</div>
                    <div className="product-description">{product.description}</div>
                    <div className={`product-stock ${product.stock > 0 ? '' : 'out'}`}>
                        {product.stock > 0 ? `In stock: ${product.stock}` : 'Out of stock'}
                    </div>
                  </div>
                </div>
              ))
            }
        </div>

      }
        {/*
          Product card structure (commented for future use):

          <div className="products-grid">
            <div className="product-card">
              <div className="product-img">
                <img src="" alt="" />
              </div>
              <div className="product-info">
                <div className="product-name">Product name</div>
                <div className="product-cat">Category</div>
                <div className="product-price">$0.00</div>
              </div>
            </div>
          </div>
        */}
      </section>

      {selectedProduct && (
        <div className="product-modal-overlay" onClick={handleCloseProduct}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="product-modal-close" type="button" onClick={handleCloseProduct} aria-label="Close product details">
              ×
            </button>

            <div className="product-modal-content">
              <div className="product-modal-image-wrap">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="product-modal-image" />
              </div>

              <div className="product-modal-info">
                <div className="product-modal-category">{selectedProduct.category}</div>
                <h3 className="product-modal-title">{selectedProduct.name}</h3>
                <div className="product-modal-price">{Number(selectedProduct.price).toFixed(2)}DA</div>
                <p className="product-modal-description">{selectedProduct.description}</p>

                <div className={`product-modal-stock ${selectedProduct.stock > 0 ? '' : 'out'}`}>
                  {selectedProduct.stock > 0 ? `In stock: ${selectedProduct.stock}` : 'Out of stock'}
                </div>

                <div className="product-modal-quantity-block">
                  <label className="product-modal-quantity-label" htmlFor="product-quantity">
                    Quantity
                  </label>
                  <input
                    id="product-quantity"
                    className="product-modal-quantity-input"
                    type="number"
                    min={1}
                    max={selectedProduct.stock || 1}
                    value={orderQuantity}
                    onChange={(e) => {
                      const nextValue = Number(e.target.value) ;
                      const safeValue = Number.isNaN(nextValue) ? 1 : nextValue ;
                      const maxValue = selectedProduct.stock > 0 ? selectedProduct.stock : 1 ;
                      setOrderQuantity(Math.min(Math.max(1, safeValue), maxValue)) ;
                    }}
                    disabled={selectedProduct.stock <= 0}
                  />
                  <span className="product-modal-quantity-hint">
                    Choose how many items you want to order
                  </span>
                </div>

                <button className="order-now-btn" type="button" onClick={handleOrderNow} disabled={ordering || selectedProduct.stock <= 0}>
                  {ordering ? (
                    <span className="btn-spinner" aria-label="Ordering" />
                  ) : (
                    "Order now!"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
}

export default DashBoard;