import React, { useEffect, useState, useRef } from "react";
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
    const toastShownRef = useRef(false);
    const redirectingRef = useRef(false);

    useEffect(() => {
      // Prevent multiple redirects
      if (redirectingRef.current) {
        return;
      }

      // Wait until authentication is resolved
      if (currentUser === null) {
        console.log("currentUser in Protected HOC:", currentUser);

        // If there's no user, redirect to login
        redirectingRef.current = true;
        router.push("/");
        return;
      }

      // Get the user's role
      const userRole = currentUser?.role || "";

      // Check if user has required role
      if (requiredRoles.includes(userRole)) {
        setIsAuthorized(true);
        setLoading(false);
      } else {
        // Only show toast once
        if (!toastShownRef.current) {
          toast.error("You do not have permission to view this page.");
          toastShownRef.current = true;
        }
        
        // Redirect based on role
        redirectingRef.current = true;
        if (userRole === "helpdesk" && !router.pathname.includes("/support")) {
          router.push("/admin/helpdesk");
        } else {
          router.push("/admin");
        }
      }
    }, [currentUser, router, requiredRoles]);

    // Reset refs when component unmounts or path changes
    useEffect(() => {
      return () => {
        toastShownRef.current = false;
        redirectingRef.current = false;
      };
    }, []);

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