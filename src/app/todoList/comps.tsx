"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Tooltip,
  message,
} from "antd";
import styles from "./page.module.css";
import { copyToClipboard, guid } from "@/utils";
import dayjs from "dayjs";
import _, { isEmpty } from 'lodash'

const Comps = ({ text }: any) => {
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState("");
  const [form] = Form.useForm();
  const [id, setId] = useState<string>("");
  const [database, setDatabase] = useState<any[]>([]);

  useEffect(() => {
    const localDatabase = JSON.parse(localStorage.getItem("todoList") || "[]");
    if(isEmpty(database)) return
    if(!_.isEqual(localDatabase, database)) {
      localStorage.setItem("todoList", JSON.stringify(database))
    }
  },[database])

  useEffect(() => {
    const localDatabase = JSON.parse(localStorage.getItem("todoList") || "[]");
    if(isEmpty(localDatabase)) return
    setDatabase(localDatabase)
  },[])

  const onEdit = (id?: string) => {
    if (!id) return;
    setId(id);
    const itemDetail = database.find((item) => item.id === id);
    form.setFieldsValue(itemDetail);
    setType("edit");
    setFormOpen(true);
  };
  const onDeleted = (id?: number) => {
    if (!id) return;
    setDatabase((data) => data.filter((item) => item.id !== id));
    message.success("删除成功");
  };
  const onAdd = () => {
    setId("");
    setType("add");
    form.resetFields();
    setFormOpen(true);
  };
  const onSubmit = () => {
    if (type === "add") {
      const newItem = {
        ...form.getFieldsValue(),
        id: guid(),
        createAt: new Date(),
      };
      setDatabase((data) => [newItem, ...data]);
    } else if (type === "edit") {
      setDatabase((data) =>
        data.map((item) =>
          item.id === id ? { ...item, ...form.getFieldsValue() } : item
        )
      );
    }
    setFormOpen(false);
    message.success("操作成功");
    console.log(form.getFieldsValue(), "submit");
  };
  const onCopy = (text?: string) => {
    copyToClipboard(text || '')
  }
  return (
    <div>
      <div className={styles.operation}>
        <Button type="primary" onClick={onAdd}>
          新增
        </Button>
      </div>
      <List
        style={{
          padding: "0 20px",
        }}
        itemLayout="horizontal"
        dataSource={database}
        renderItem={(item, index) => (
          <List.Item
            actions={[
              <Button key={index} type="link" onClick={() => onEdit(item.id)}>
                编辑
              </Button>,
              <Popconfirm
                key={index}
                title="确认删除吗"
                onConfirm={() => onDeleted(item.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={
                <Tooltip title={'创建时间: ' + dayjs(item.timeAt).format('YYYY-MM-DD HH:mm:ss')}>
                  <span>
                    {index + 1}、{item.title}
                  </span>
                </Tooltip>
              }
              description={<Tooltip title="点击复制"><span onClick={() => onCopy(item.description)}>{item.description}</span></Tooltip>}
            />
          </List.Item>
        )}
      />
      <Modal
        width={800}
        open={formOpen}
        destroyOnClose
        onCancel={() => setFormOpen(false)}
        onOk={onSubmit}
        title={type === "add" ? "新增" : "编辑"}
      >
        <Form form={form}>
          <Form.Item name="title" label="需求标题">
            <Input placeholder="请输入需求标题" />
          </Form.Item>
          <Form.Item name="description" label="分支名称">
            <Input placeholder="请输入分支名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Comps;
