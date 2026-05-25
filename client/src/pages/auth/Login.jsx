import './Login.css';

import {
  LockKeyhole,
  Mail,
  UtensilsCrossed
} from 'lucide-react';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {

  const navigate = useNavigate();

  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [isLoading,setIsLoading] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem('dinezy_token');

    const rawUser =
      localStorage.getItem('dinezy_user');

    if(!token || !rawUser) return;

    let user = null;
    try{
      user = JSON.parse(rawUser);
    }
    catch{
      user = null;
    }

    const role = String(user?.role || '').toUpperCase();

    if(role === 'OWNER'){
      navigate('/owner', { replace:true });
    }
    else if(role === 'MANAGER'){
      navigate('/manager', { replace:true });
    }
    else if(role === 'CAPTAIN'){
      navigate('/captain', { replace:true });
    }
    else if(role === 'KITCHEN'){
      navigate('/kitchen', { replace:true });
    }
  },[navigate]);

  const handleLogin = async () => {

    try{
      setIsLoading(true);

      const API_URL =
        import.meta.env.VITE_API_URL ||
        'http://localhost:5000';

      const res = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json'
          },
          body:JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await res.json();

      if(!res.ok || !data?.success){
        throw new Error(
          data?.message || 'Login Failed'
        );
      }

      localStorage.setItem(
        'dinezy_token',
        data.token
      );

      localStorage.setItem(
        'dinezy_user',
        JSON.stringify(data.user)
      );

      const role = data?.user?.role;

      if(role === 'OWNER'){
        navigate('/owner', { replace:true });
      }
      else if(role === 'MANAGER'){
        navigate('/manager', { replace:true });
      }
      else if(role === 'CAPTAIN'){
        navigate('/captain', { replace:true });
      }
      else if(role === 'KITCHEN'){
        navigate('/kitchen', { replace:true });
      }
      else{
        throw new Error('Invalid Role');
      }

    }
    catch(error){
      alert(error.message);
    }
    finally{
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay"></div>

      <div className="login-container">
        {/* Left Side: Branding (Hidden on Mobile) */}
        <div className="login-left">
          <div className="brand-box">
            <div className="brand-icon">
              <UtensilsCrossed size={45} />
            </div>
            <h1>Dinezy POS</h1>
            <p>Restaurant Management System</p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-right">
          <div className="login-box">
            {/* Mobile-only Header (Shows only on mobile screens) */}
            <div className="mobile-brand-header">
              <div className="mobile-brand-icon">
                <UtensilsCrossed size={28} />
              </div>
              <h2>Dinezy POS</h2>
            </div>

            <h2>Welcome Back</h2>
            <p className="login-subtitle">Login to continue your session</p>

            <div className="input-box">
              <Mail size={18} />
              <input
                type="email"
                placeholder="Enter Email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-box">
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="Enter Password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loader-text">Logging in...</span>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
