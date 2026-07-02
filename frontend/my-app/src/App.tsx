import {BrowserRouter , Routes , Route} from 'react-router-dom'
import SignIn from './SignIn.tsx';
import Home from './Home.tsx';
import SignUp from './SignUp.tsx';
import VerifyCode from './VerifyCode.tsx';
import DashBoard from './DashBoard.tsx';
import DashBoardAdmin from './DashBoardAdmin.tsx';
import ForgetPassword from './ForgetPassword.tsx';
import VerifyCodePw from './VerifyCodePw.tsx';
import ResetPassword from './ResetPassword.tsx';
import Orders from './Orders.tsx';
function App(){
  return(
    <BrowserRouter>
       <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard/:id" element={<DashBoard />} />
          <Route path="/dashboardadmin/:id" element={<DashBoardAdmin />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify/:id" element={<VerifyCode />} />
          <Route path="/forgetpassword" element={<ForgetPassword />} />
          <Route path="/verifycodepw/:id" element={<VerifyCodePw />} />
          <Route path="/resetpassword/:id" element={<ResetPassword />} />
          <Route path="/dashboard/orders/:id" element={<Orders />} />
       </Routes>
    </BrowserRouter>
  )
}

export default App