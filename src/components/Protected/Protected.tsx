import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Spin } from "antd";
import { useAuth } from "../../authentication/AuthContext";
import { toast } from "react-hot-toast";

/**
 * Protected is a Higher Order Component that restricts access to pages 
 * based on user roles. If the user doesn't have the required role,
 * they will be redirected to an appropriate page.
 */
const Protected = (WrappedComponent: React.ComponentType<any>, requiredRoles: string[]) => {
  return (props: any) => {
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const { currentUser } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Wait until authentication is resolved
      if (currentUser === null) {
        // If there's no user, redirect to login
        router.push("/");
        return;
      }

      // Get the user's role
      const userRole = currentUser?.role || "";

      // Check if user has required role
      if (requiredRoles.includes(userRole)) {
        setIsAuthorized(true);
      } else {
        toast.error("You do not have permission to view this page.");
        
        // Redirect based on role
        if (userRole === "helpdesk" && !router.pathname.includes("/support")) {
          router.push("/admin/support/tickets");
        } else {
          router.push("/admin");
        }
      }
      
      setLoading(false);
    }, [currentUser, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Spin size="large" />
        </div>
      );
    }

    return isAuthorized ? <WrappedComponent {...props} /> : null;
  };
};

export default Protected; 