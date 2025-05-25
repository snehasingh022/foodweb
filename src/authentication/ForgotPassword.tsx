import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
<<<<<<< HEAD
import { Form, Input, Button, Row, Col, message } from 'antd';
import { 
  getAuth, 
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

function ForgotPassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  const checkEmailInDatabase = async (email: string) => {
    try {
      // Query the admin collection to check if email exists with where clause
      const q = query(
        collection(db, "admins"), 
        where("email", "==", email),
        where("status", "==", "active") // Only check active admins
      );
      const querySnapshot = await getDocs(q);
      
      console.log('Email check result:', !querySnapshot.empty); // Debug log
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email in database:', error);
      throw new Error('Failed to verify email in database');
    }
  };

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    
    try {
      console.log('Checking email:', values.email); // Debug log
      
      // First, check if email exists in your admin database
      const emailExistsInDB = await checkEmailInDatabase(values.email);
      
      if (!emailExistsInDB) {
        message.error('This email is not registered as an admin account or account is not active');
        setLoading(false);
        return;
      }

      // Check if email exists in Firebase Auth
      const signInMethods = await fetchSignInMethodsForEmail(auth, values.email);
      
      if (signInMethods.length === 0) {
        message.error('No Firebase account found with this email address');
        setLoading(false);
        return;
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, values.email);
      
      message.success('Password reset instructions have been sent to your email');
      
      // Optionally redirect to a confirmation page or login page
      setTimeout(() => {
        router.push('/admin/login'); // Updated route to match your admin structure
      }, 2000);
      
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/user-not-found':
          message.error('No Firebase account found with this email address');
          break;
        case 'auth/invalid-email':
          message.error('Please enter a valid email address');
          break;
        case 'auth/too-many-requests':
          message.error('Too many requests. Please try again later');
          break;
        case 'auth/user-disabled':
          message.error('This account has been disabled');
          break;
        default:
          message.error('Failed to send reset email. Please try again');
      }
    } finally {
      setLoading(false);
    }
=======
import { Form, Input, Button, Row, Col } from 'antd';

function ForgotPassword() {
  const router = useRouter();
  const [state, setState] = useState({
    values: null,
  });
  const handleSubmit = (values:any) => {
    router.push('/admin')
    setState({ ...state, values });
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  };

  return (
    <Row justify="center">
      <Col xxl={6} xl={8} md={12} sm={18} xs={24}>
        <div className="mt-6 p-0 bg-white dark:bg-white/10 rounded-md shadow-regular dark:shadow-none">
          <Form name="forgotPass" onFinish={handleSubmit} layout="vertical">
            <div className="px-5 py-4 text-center border-b border-gray-200 dark:border-white/10">
              <h2 className="mb-0 text-xl font-semibold text-dark dark:text-white/[.87]">Forgot Password?</h2>
            </div>
            <div className="px-10 pt-8 pb-6">
              <p className="mb-4 dark:text-white/60">
<<<<<<< HEAD
                Enter the email address you used when you joined and we'll send you instructions to reset your password.
=======
                Enter the email address you used when you joined and we’ll send you instructions to reset your password.
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              </p>
              <Form.Item
                label="Email Address"
                name="email"
<<<<<<< HEAD
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email address!' }
                ]}
              >
                <Input 
                  placeholder="name@example.com" 
                  disabled={loading}
                />
=======
                rules={[{ required: true, message: 'Please input your email!', type: 'email' }]}
              >
                <Input placeholder="name@example.com" />
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
              </Form.Item>
              <Form.Item>
                <Button
                  className="block w-full bg-primary h-12 p-0 text-sm font-medium"
                  htmlType="submit"
                  type="primary"
                  size="large"
<<<<<<< HEAD
                  loading={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
=======
                >
                  Send Reset Instructions
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                </Button>
              </Form.Item>
            </div>
            <div className="p-6 text-center bg-section dark:bg-white/10 rounded-b-md">
              <p className="mb-0 text-sm font-medium text-body dark:text-white/60">
                Return to
<<<<<<< HEAD
                <Link href="/admin/login" className="ltr:ml-1.5 rtl:mr-1.5 text-info hover:text-primary">
=======
                <Link href="/" className="ltr:ml-1.5 rtl:mr-1.5 text-info hover:text-primary">
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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

<<<<<<< HEAD
export default ForgotPassword;
=======
export default ForgotPassword;
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
