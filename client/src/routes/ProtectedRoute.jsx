import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({
  children,
  roles = []
}) => {

  const token =
    localStorage.getItem('dinezy_token');

  const rawUser =
    localStorage.getItem('dinezy_user');

  let user = null;

  try{
    user = rawUser ? JSON.parse(rawUser) : null;
  }
  catch{
    user = null;
  }

  if(!token || !user){
    return <Navigate to="/" replace />;
  }

  if(
    Array.isArray(roles) &&
    roles.length > 0 &&
    !roles.includes(user.role)
  ){
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

