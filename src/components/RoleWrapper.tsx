import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Spin } from 'antd';
import { useAuth } from '../authentication/AuthContext';

type RoleWrapperProps = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

/**
 * RoleWrapper component to control access to pages based on user role
 * If user's role is not in allowedRoles, they are redirected to appropriate page
 */
const RoleWrapper: React.FC<RoleWrapperProps> = ({ 
  children, 
  allowedRoles = ['admin'] // By default, only admin can access
}) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Wait until authentication is resolved
    if (currentUser === null) return;
    
    const userRole = currentUser?.role || '';
    
    // Handle role-based redirects
    if (!allowedRoles.includes(userRole)) {
      // If user is helpdesk, redirect to support tickets
      if (userRole === 'helpdesk' && !router.pathname.includes('/support')) {
        router.push('/admin/support/tickets');
      } 
      // If user has any other unauthorized role, redirect to dashboard
      else if (userRole !== 'helpdesk' && !allowedRoles.includes(userRole)) {
        router.push('/admin');
      }
    }
    
    setLoading(false);
  }, [currentUser, router, allowedRoles]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }
  
  return <>{children}</>;
};

export default RoleWrapper; 