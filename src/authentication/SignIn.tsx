import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Form, Input, Button, Row, Col } from 'antd';
import { useDispatch } from 'react-redux';
import { logInAction } from '@/redux/authentication/actionCreator';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth } from './AuthContext'


function SignIn() {

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  const router = useRouter();
  const { user } = useUser();
  const { currentUser } = useAuth();

  if (user) {
    router.push('/admin');
    // @ts-ignore
    dispatch(logInAction(() => router.push('/admin')));
  }

  const { login } = useAuth()
  const [data, setData] = useState({
    email: '',
    password: '',
  })

  const handleLogin = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      setError("");
      // @ts-ignore
      dispatch(logInAction(() => router.push('/admin')));
      console.log('Successfully Logged In!');
    } catch (err: any) {
      console.log(err);
      setLoading(false);
      // Check for specific error messages
      if (err.message && err.message.includes("Unauthorized")) {
        setError("Unauthorized: You are not registered as an admin or partner, or your status is not active");
      } else if (err.code === "auth/user-not-found") {
        setError("User not found. Please check your email.");
      } else if (err.code === "auth/wrong-password") {
        setError("Invalid password. Please try again.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed login attempts. Please try again later.");
      } else {
        setError("Failed to login. Please check your credentials.");
      }
    }
  }

  const [form] = Form.useForm();
  const [state, setState] = useState({
    checked: false,
  });

  const checkboxChange = (checked: boolean) => {
    setState({ ...state, checked });
  };

  useEffect(() => {
    // Use Initial Email & Password
    let email = document.querySelector('input[type="email"]');
    let emailValue = (email as HTMLInputElement).value;
    let password = document.querySelector('input[type="password"]');
    let passwordValue = (password as HTMLInputElement).value;

    setData({
      email: emailValue,
      password: passwordValue,
    })
  }, []);

  return (
    <Row justify="center">
      <Col xxl={6} xl={8} md={12} sm={18} xs={24}>
        <div className="mt-6 bg-white rounded-md dark:bg-white/10 shadow-regular dark:shadow-none">
          <div className="px-5 py-4 text-center border-b border-gray-200 dark:border-white/10">
            <h2 className="mb-0 text-xl font-semibold text-dark dark:text-white/[.87]">Sign in</h2>
          </div>
          <div className="px-10 pt-8 pb-6">
            <Form name="login" form={form} onFinish={handleLogin} layout="vertical">
              <Form.Item
                name="email"
                rules={[{ message: 'Please input your username or Email!', required: true }]}
                label="Username or Email Address"
                className="[&>div>div>label]:text-sm [&>div>div>label]:text-dark dark:[&>div>div>label]:text-white/60 [&>div>div>label]:font-medium"
              >
                <Input
                  type="email"
                  value={data.email}
                  placeholder="name@example.com"
                  className="h-12 p-3 hover:border-primary focus:border-primary rounded-4"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setData({
                      ...data,
                      email: e.target.value,
                    })
                  }
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                className="[&>div>div>label]:text-sm [&>div>div>label]:text-dark dark:[&>div>div>label]:text-white/60 [&>div>div>label]:font-medium"
              >
                <Input.Password
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setData({
                      ...data,
                      password: e.target.value,
                    })
                  }
                  value={data.password}
                  type="password"
                  placeholder="Password"
                  className="h-12 p-3 hover:border-primary focus:border-primary rounded-4"
                />
              </Form.Item>
              <div className="flex flex-wrap items-center justify-between gap-[10px]">
                <Link className=" text-primary text-13" href="/forgotPassword">
                  Forgot password?
                </Link>
              </div>
              <Form.Item>
                <Button
                  className="w-full bg-primary h-12 p-0 my-6 text-sm font-medium"
                  htmlType="submit"
                  type="primary"
                  size="large"
                >
                  {loading ? 'Loading...' : 'Sign In'}
                </Button>
              </Form.Item>
              {error && <p className="text-danger mb-10 text-center text-base">{error}</p>}
            </Form>
          </div>
        </div>
      </Col>
    </Row>
  );
}

export default SignIn;
