import React, { useEffect, useState } from "react";
import { Table, message, Modal, Form, Input, Button } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/users");
      setUsers(response.data);
    } catch (error) {
      message.error("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue({ ...user, oldPassword: "" }); // Populate the form with user data and reset oldPassword
    setIsModalVisible(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      const { oldPassword, ...updatedValues } = values; // Extract oldPassword from form values

      // Send the old password and updated details to the backend
      await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, {
        ...updatedValues,
        oldPassword,
      });

      message.success("User updated successfully!");
      setIsModalVisible(false);
      setEditingUser(null);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      if (error.response && error.response.data.error) {
        message.error(error.response.data.error); // Show backend error message
      } else {
        message.error("Failed to update user.");
      }
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
  };

  const handleAddUser = () => {
    setIsAddUserModalVisible(true);
  };

  const handleAddUserCancel = () => {
    setIsAddUserModalVisible(false);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => dayjs(date).format("DD/MM/YYYY"), // Format date
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <button
          onClick={() => handleEdit(record)}
          style={{
            background: "none",
            border: "none",
            color: "#1890ff",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2>Users List</h2>
      <Button
        type="primary"
        style={{ marginBottom: "20px" }}
        onClick={handleAddUser}
      >
        Add User
      </Button>
      <Table
        dataSource={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        bordered
      />
      <Modal
        title="Edit User"
        visible={isModalVisible}
        onOk={handleUpdate}
        onCancel={handleCancel}
        okText="Update"
        cancelText="Cancel"
        width={500}
        bodyStyle={{ padding: '24px 0' }}
        style={{ borderRadius: '8px' }}
      >
        <Form 
          form={form} 
          initialValues={editingUser}
          layout="vertical"
          style={{ maxWidth: '400px', margin: '0 auto' }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input the username!" }]}
          >
            <Input style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input the email!" }]}
          >
            <Input style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="oldPassword"
            label="Old Password"
            rules={[{ required: true, message: "Please input your old password!" }]}
          >
            <Input.Password style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="password"
            label="New Password"
            rules={[{ required: true, message: "Please input the new password!" }]}
          >
            <Input.Password style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Add New User"
        visible={isAddUserModalVisible}
        onOk={form.submit}
        onCancel={handleAddUserCancel}
        okText="Create"
        cancelText="Cancel"
        width={500}
        bodyStyle={{ padding: '24px 0' }}
        style={{ borderRadius: '8px' }}
      >
        <Form
          form={form}
          onFinish={async (values) => {
            try {
              await axios.post("http://localhost:5000/api/register", values);
              message.success("User added successfully!");
              setIsAddUserModalVisible(false);
              fetchUsers();
            } catch (error) {
              message.error("Failed to add user.");
            }
          }}
          layout="vertical"
          style={{ maxWidth: '400px', margin: '0 auto' }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Please input the username!" }]}
          >
            <Input style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Please input the email!" }]}
          >
            <Input style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please input the password!" }]}
          >
            <Input.Password style={{ height: '40px', borderRadius: '6px' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;