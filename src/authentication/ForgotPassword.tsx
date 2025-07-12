import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Form, Input, Button, Row, Col, message } from 'antd';
import { useAuth } from './AuthContext';
import { 
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from './firebase';

function ForgotPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Enhanced database checking logic matching your partners schema
  const checkEmailInPartnersDatabase = async (email: string) => {
    try {
      console.log('Checking email in partners database:', email);
      
      // Query the partners collection using your exact schema
      const partnersQuery = query(
        collection(db, "partners"), 
        where("email", "==", email),
        where("status", "==", "active") // Only check active partners
      );
      const partnerSnapshot = await getDocs(partnersQuery);
      
      if (!partnerSnapshot.empty) {
        const partnerDoc = partnerSnapshot.docs[0];
        const partnerData = partnerDoc.data();
        
        console.log('Partner data found:', partnerData);
        
        // Partners are authorized if they exist and are active
        return {
          exists: true,
          userData: {
            name: partnerData.name,
            email: partnerData.email,
            phone: partnerData.phone,
            country: partnerData.country,
            status: partnerData.status
          }
        };
      }
      
      return { exists: false, userData: null };
    } catch (error) {
      console.error('Error checking email in partners database:', error);
      throw new Error('Failed to verify email in database');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const partnerCheck = await checkEmailInPartnersDatabase(email);
      
      if (!partnerCheck.exists) {
        throw new Error('UNAUTHORIZED: You are not registered as a partner or your status is not active');
      }

      try {
        await sendPasswordResetEmail(auth, email);
        console.log('Password reset email sent successfully to:', email);
        
        return { 
          success: true, 
          message: 'Password reset instructions sent successfully',
          userData: partnerCheck.userData 
        };
      } catch (firebaseError: any) {
        console.error('Firebase sendPasswordResetEmail error:', firebaseError);
        
        if (firebaseError.code === 'auth/user-not-found') {
          throw new Error('AUTH_NOT_FOUND: No Firebase account found with this email address. Please contact your administrator to create your account.');
        } else if (firebaseError.code === 'auth/invalid-email') {
          throw new Error('INVALID_EMAIL: Invalid email format');
        } else if (firebaseError.code === 'auth/too-many-requests') {
          throw new Error('TOO_MANY_REQUESTS: Too many password reset requests');
        } else {
          throw firebaseError;
        }
      }
      
    } catch (error: any) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    
    try {
      console.log('Processing forgot password request for:', values.email);
      
      const result = await forgotPassword(values.email);
      
      // Success message
      message.success({
        content: 'Password reset instructions have been sent to your email address. Please check your inbox and spam folder.',
        duration: 5,
      });
      
      // Clear the form
      form.resetFields();
      
      // Redirect to sign in page after success
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error in forgot password process:', error);
      
      // Enhanced error handling
      if (error.message && error.message.includes("UNAUTHORIZED")) {
        message.error({
          content: "Access Denied: You do not have permission to access this system. Please contact your administrator.",
          duration: 6,
        });
      } else if (error.message && error.message.includes("AUTH_NOT_FOUND")) {
        message.error({
          content: "Your email is registered in our system but no Firebase account exists. Please contact your administrator to set up your account.",
          duration: 6,
        });
      } else if (error.code === "auth/user-not-found") {
        message.error({
          content: "Your email is registered in our system but no Firebase account exists. Please contact your administrator to set up your account.",
          duration: 6,
        });
      } else if (error.code === "auth/invalid-email") {
        message.error("Please enter a valid email address");
      } else if (error.code === "auth/too-many-requests") {
        message.error({
          content: "Too many password reset requests. Please wait a few minutes before trying again.",
          duration: 5,
        });
      } else if (error.code === "auth/user-disabled") {
        message.error("This account has been disabled. Please contact support.");
      } else {
        message.error({
          content: "Failed to send reset email. Please try again or contact support if the problem persists.",
          duration: 5,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center">
      <Col xxl={6} xl={8} md={12} sm={18} xs={24}>
        <div className="mt-6 p-0 bg-white dark:bg-white/10 rounded-md shadow-regular dark:shadow-none">
          <Form 
            name="forgotPass" 
            form={form}
            onFinish={handleSubmit} 
            layout="vertical"
            preserve={false}
          >
            <div className="px-5 py-4 text-center border-b border-gray-200 dark:border-white/10">
              <h2 className="mb-0 text-xl font-semibold text-dark dark:text-white/[.87]">
                Forgot Password?
              </h2>
            </div>
            
            <div className="px-10 pt-8 pb-6">
              <p className="mb-4 dark:text-white/60">
                Enter your registered email address and we'll send you instructions to reset your password.
              </p>
              
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { 
                    required: true, 
                    message: 'Please enter your email address!' 
                  },
                  { 
                    type: 'email', 
                    message: 'Please enter a valid email address!' 
                  },
                  {
                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a properly formatted email address!'
                  }
                ]}
                className="[&>div>div>label]:text-sm [&>div>div>label]:text-dark dark:[&>div>div>label]:text-white/60 [&>div>div>label]:font-medium"
              >
                <Input 
                  type="email"
                  placeholder="Enter your email address"
                  className="h-12 p-3 hover:border-primary focus:border-primary rounded-4"
                  disabled={loading}
                  autoComplete="email"
                />
              </Form.Item>
              
              <Form.Item>
                <Button
                  className="block w-full bg-primary h-12 p-0 text-sm font-medium"
                  htmlType="submit"
                  type="primary"
                  size="large"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? ' Sending...' : 'Send Reset Instructions'}
                </Button>
              </Form.Item>
            </div>
            
            <div className="p-6 text-center bg-section dark:bg-white/10 rounded-b-md">
              <p className="mb-0 text-sm font-medium text-body dark:text-white/60">
                Remember your password?
                <Link 
                  href="/admin/login" 
                  className="ltr:ml-1.5 rtl:mr-1.5 text-info hover:text-primary"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </Form>
        </div>
      </Col>
    </Row>
  );
}

export default ForgotPassword;