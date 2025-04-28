import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import axios from "axios";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/login", values);
      localStorage.setItem("token", response.data.token); // Save token to localStorage
      localStorage.setItem("userName", response.data.userName); // Save the user's name
      message.success("Login successful!");
      navigate("/"); // Redirect to the dashboard
    } catch (error) {
      message.error("Invalid username or password!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)"
    }}>
      <div style={{
        background: "white",
        padding: "2rem",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "400px",
        textAlign: "center"
      }}>
        <img 
          src="/logo.jpg" 
          alt="Logo" 
          style={{ 
            width: "200px", 
            height: "auto", 
            marginBottom: "-1rem" 
          }} 
        />
        <h2 style={{ 
          marginBottom: "1.5rem", 
          color: "#333",
          fontWeight: "500"
        }}>Welcome Back</h2>
        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input 
              placeholder="Username" 
              size="large"
              style={{ borderRadius: "5px" }}
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password 
              placeholder="Password" 
              size="large"
              style={{ borderRadius: "5px" }}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              size="large"
              style={{ 
                height: "45px",
                borderRadius: "5px",
                fontSize: "16px",
                background: "#1890ff",
                border: "none"
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;