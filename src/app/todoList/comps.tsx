"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  Table,
  Modal,
  Popconfirm,
  Tooltip,
  message,
  DatePicker,
  Select,
  Tag,
  Space,
} from "antd";
import { BulbOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import styles from "./page.module.css";
import { copyToClipboard, guid } from "@/utils";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _, { isEmpty } from 'lodash'
import { getBranch } from "@/service/getBranch";

// 确保dayjs使用中文
dayjs.locale('zh-cn');

const Comps = ({ text }: any) => {
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState("");
  const [form] = Form.useForm();
  const [id, setId] = useState<string>("");
  const [database, setDatabase] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [configOpen, setConfigOpen] = useState(false);
  const [configForm] = Form.useForm();
  const [generatingBranch, setGeneratingBranch] = useState(false);
  const [portList, setPortList] = useState<string[]>([]);
  const [newPort, setNewPort] = useState('');

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
    
    // 处理日期字段，确保是dayjs对象
    if (itemDetail) {
      const processedItem = {
        ...itemDetail,
        releaseDate: itemDetail.releaseDate ? dayjs(itemDetail.releaseDate) : undefined
      };
      form.setFieldsValue(processedItem);
    }
    
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
    const formData = form.getFieldsValue();
    const branchName = formData.description;

    // 校验分支名是否重复
    if (branchName) {
      const isDuplicate = database.some(item => {
        // 新增时：检查所有记录
        if (type === "add") {
          return item.description === branchName;
        }
        // 编辑时：排除当前编辑的记录
        if (type === "edit") {
          return item.id !== id && item.description === branchName;
        }
        return false;
      });

      if (isDuplicate) {
        message.error("分支名不可重复，请修改后重试");
        return;
      }
    }

    if (type === "add") {
      const newItem = {
        ...formData,
        id: guid(),
        createAt: new Date(),
      };
      setDatabase((data) => [newItem, ...data]);
    } else if (type === "edit") {
      setDatabase((data) =>
        data.map((item) =>
          item.id === id ? { ...item, ...formData } : item
        )
      );
    }
    setFormOpen(false);
    message.success("操作成功");
  };
  const onCopy = (text?: string) => {
    copyToClipboard(text || '')
  }

  const onConfig = () => {
    // 读取本地配置并回显
    const localConfig = JSON.parse(localStorage.getItem("todoConfig") || "{}");
    const ports = localConfig.portList || [];
    
    configForm.setFieldsValue({
      branchFormat: localConfig.branchFormat || "feature-xxx-xxx",
      customPrompt: localConfig.customPrompt || "",
    });
    setPortList(ports);
    setConfigOpen(true);
  };

  const onConfigSave = () => {
    const configData = {
      ...configForm.getFieldsValue(),
      portList: portList
    };
    // 保存到本地存储
    localStorage.setItem("todoConfig", JSON.stringify(configData));
    setConfigOpen(false);
    message.success("配置保存成功");
  };

  const addPort = () => {
    if (newPort && !portList.includes(newPort)) {
      setPortList([...portList, newPort]);
      setNewPort('');
    } else if (portList.includes(newPort)) {
      message.warning('端口已存在');
    }
  };

  const removePort = (port: string) => {
    setPortList(portList.filter(p => p !== port));
  };

  const onGenerateBranch = async () => {
    const title = form.getFieldValue('title');
    if (!title) {
      message.warning('请先输入需求标题');
      return;
    }

    setGeneratingBranch(true);
    try {
      // 获取配置中的分支格式
      const localConfig = JSON.parse(localStorage.getItem("todoConfig") || "{}");
      const branchFormat = localConfig.branchFormat || "feature-xxx-xxx";
      const customPrompt = localConfig.customPrompt || "";
      const branchName = await getBranch(title, {
        branchFormat,
        customPrompt
      });
      if (branchName) {
        form.setFieldValue('description', branchName);
        message.success('分支名生成成功');
      }
    } catch (error) {
      message.error('生成分支名失败，请稍后重试');
    } finally {
      setGeneratingBranch(false);
    }
  };

  const columns = [
    {
      title: 'id',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => {
        return database.length - ((currentPage - 1) * pageSize + index);
      },
    },
    {
      title: '需求标题',
      dataIndex: 'title',
      key: 'title',
      width: 280,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索需求标题"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </div>
        </div>
      ),
      onFilter: (value: any, record: any) =>
        record.title?.toString().toLowerCase().includes(value.toString().toLowerCase()),
      render: (text: string, record: any) => (
        <Tooltip title={text}>
          <span 
            className={styles.title}
            onClick={() => onCopy(text)}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '分支名称',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索分支名称"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </div>
        </div>
      ),
      onFilter: (value: any, record: any) =>
        record.description?.toString().toLowerCase().includes(value.toString().toLowerCase()),
      render: (text: string) => (
        <Tooltip title={text}>
          <span className={styles.description} onClick={() => onCopy(text)}>
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '发布计划',
      dataIndex: 'releaseDate',
      key: 'releaseDate',
      width: 120,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            placeholder={['开始日期', '结束日期']}
            value={selectedKeys[0] ? [dayjs(selectedKeys[0][0]), dayjs(selectedKeys[0][1])] : null}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setSelectedKeys([[dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]]);
              } else {
                setSelectedKeys([]);
              }
            }}
            style={{ marginBottom: 8, display: 'block', width: '100%' }}
            format="YYYY-MM-DD"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              筛选
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </div>
        </div>
      ),
      onFilter: (value: any, record: any) => {
        if (!record.releaseDate || !value || !Array.isArray(value)) return true;
        
        const recordDate = dayjs(record.releaseDate);
        if (!recordDate.isValid()) return false;
        
        const [startDate, endDate] = value;
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        
        return (recordDate.isAfter(start.subtract(1, 'day')) || recordDate.isSame(start, 'day')) && 
               (recordDate.isBefore(end.add(1, 'day')) || recordDate.isSame(end, 'day'));
      },
      render: (text: any) => {
        if (!text) return '-';
        const displayText = dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : text;
        return (
          <Tooltip title={displayText}>
            <span className={styles.ellipsisText}>{displayText}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '发布端口',
      dataIndex: 'releasePort',
      key: 'releasePort',
      width: 100,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
        const localConfig = JSON.parse(localStorage.getItem("todoConfig") || "{}");
        const portList = localConfig.portList || ["3000", "8080", "9000"];
        
        return (
          <div style={{ padding: 8 }}>
            <Select
              placeholder="选择发布端口"
              value={selectedKeys[0]}
              onChange={(value) => setSelectedKeys(value ? [value] : [])}
              style={{ marginBottom: 8, display: 'block', width: '100%' }}
              allowClear
            >
              {portList.map((port: string) => (
                <Select.Option key={port} value={port}>
                  {port}
                </Select.Option>
              ))}
            </Select>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                type="primary"
                onClick={() => confirm()}
                size="small"
                style={{ width: 90 }}
              >
                筛选
              </Button>
              <Button
                onClick={() => {
                  clearFilters();
                  confirm();
                }}
                size="small"
                style={{ width: 90 }}
              >
                重置
              </Button>
            </div>
          </div>
        );
      },
      onFilter: (value: any, record: any) => {
        if (!record.releasePort || !value) return true;
        
        // 处理多选端口的筛选
        if (Array.isArray(record.releasePort)) {
          return record.releasePort.includes(value);
        }
        
        // 兼容旧的单选格式
        return record.releasePort === value;
      },
      render: (text: any) => {
        if (!text) return '-';
        
        // 处理多选端口的显示
        if (Array.isArray(text)) {
          const displayText = text.join(', ');
          return (
            <Tooltip title={displayText}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {text.map((port: string, index: number) => (
                  <Tag key={index} color="blue">
                    {port}
                  </Tag>
                ))}
              </div>
            </Tooltip>
          );
        }
        
        // 兼容旧的单选格式
        return (
          <Tooltip title={text}>
            <Tag color="blue">
              {text}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '发布前配置',
      dataIndex: 'preReleaseConfig',
      key: 'preReleaseConfig',
      width: 150,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="搜索发布前配置"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              搜索
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </div>
        </div>
      ),
      onFilter: (value: any, record: any) =>
        record.preReleaseConfig?.toString().toLowerCase().includes(value.toString().toLowerCase()),
      render: (text: string) => {
        if (!text) return '-';
        return (
          <Tooltip title={text}>
            <div className={styles.configText}>
              {text}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createAt',
      key: 'createAt',
      width: 150,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <DatePicker.RangePicker
            placeholder={['开始日期', '结束日期']}
            value={selectedKeys[0]}
            onChange={(dates) => setSelectedKeys(dates ? [dates] : [])}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              onClick={() => confirm()}
              size="small"
              style={{ width: 90 }}
            >
              筛选
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              重置
            </Button>
          </div>
        </div>
      ),
      onFilter: (value: any, record: any) => {
        if (!value || !value[0] || !value[1] || !record.createAt) return true;
        const recordDate = dayjs(record.createAt);
        const startDate = dayjs(value[0]);
        const endDate = dayjs(value[1]);
        return recordDate.isAfter(startDate) && recordDate.isBefore(endDate.add(1, 'day'));
      },
      render: (date: string) => {
        if (!date) return '-';
        return (
          <span className={styles.timeText}>
            {dayjs(date).format('YYYY-MM-DD HH:mm:ss')}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <div>
          <Button type="link" onClick={() => onEdit(record.id)} size="small">
            编辑
          </Button>
          <Popconfirm
            title="确认删除吗"
            onConfirm={() => onDeleted(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger size="small">
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // useEffect(() => {
  //   getAnswer({ question: '你好', isSingleChat: true })
  //     .then(res => {
  //     })
  //     .catch(error => {
  //     });
  // },[])

  return (
    <div>
      <div className={styles.operation}>
        <Button type="primary" onClick={onAdd}>
          新增
        </Button>
        <Button onClick={onConfig} style={{ marginLeft: 8 }}>
          配置
        </Button>
      </div>
      <div className={styles.list}>
        <Table
          columns={columns}
          dataSource={database}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSizeOptions: ['5', '10', '20', '50'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
            onShowSizeChange: (current, size) => {
              setCurrentPage(1); // 改变页大小时回到第一页
              setPageSize(size);
            },
          }}
          className={styles.beautifulTable}
          style={{ margin: 0 }}
        />
      </div>
      
      <Modal
        width={800}
        open={formOpen}
        destroyOnClose
        onCancel={() => setFormOpen(false)}
        onOk={onSubmit}
        title={type === "add" ? "新增" : "编辑"}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="需求标题">
            <Input 
              placeholder="请输入需求标题" 
              suffix={
                <Tooltip title="AI生成分支名">
                  <BulbOutlined 
                    onClick={onGenerateBranch}
                    style={{ 
                      cursor: 'pointer', 
                      color: generatingBranch ? '#1890ff' : '#8c8c8c',
                      fontSize: '16px'
                    }}
                    spin={generatingBranch}
                  />
                </Tooltip>
              }
            />
          </Form.Item>
          <Form.Item name="description" label="分支名称">
            <Input placeholder="请输入分支名称" />
          </Form.Item>
          <Form.Item name="releaseDate" label="发布计划">
            <DatePicker 
              placeholder="请选择发布日期" 
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item name="releasePort" label="发布端口">
            <Select 
              mode="multiple"
              placeholder="请选择发布端口（可多选）" 
              style={{ width: '100%' }}
              allowClear
              maxTagCount="responsive"
              showSearch
              filterOption={(input, option) => {
                if (!option?.children) return false;
                const text = String(option.children);
                return text.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {(() => {
                const localConfig = JSON.parse(localStorage.getItem("todoConfig") || "{}");
                const ports = localConfig.portList || [];
                return ports.map((port: string) => (
                  <Select.Option key={port} value={port}>
                    {port}
                  </Select.Option>
                ));
              })()}
            </Select>
          </Form.Item>
          <Form.Item name="preReleaseConfig" label="发布前配置">
            <Input.TextArea 
              placeholder="请输入发布前配置信息" 
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 配置弹窗 */}
      <Modal
        width={600}
        open={configOpen}
        destroyOnClose
        onCancel={() => setConfigOpen(false)}
        onOk={onConfigSave}
        title="配置"
      >
        <Form form={configForm} layout="vertical">
          <Form.Item 
            name="branchFormat" 
            label="分支格式"
            rules={[{ required: true, message: '请输入分支格式' }]}
          >
            <Input placeholder="请输入分支格式，如：feature-xxx-xxx" />
          </Form.Item>
          <Form.Item name="customPrompt" label="自定义Prompt">
            <Input.TextArea 
              placeholder="请输入ai生成分支名自定义Prompt内容" 
              rows={6}
              maxLength={1000}
              showCount
            />
          </Form.Item>
          
          <Form.Item label="发布端口管理">
            <div style={{ marginBottom: 16 }}>
              <Space.Compact style={{ display: 'flex' }}>
                <Input
                  placeholder="输入新端口"
                  value={newPort}
                  onChange={(e) => setNewPort(e.target.value)}
                  onPressEnter={addPort}
                />
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={addPort}
                >
                  添加
                </Button>
              </Space.Compact>
            </div>
            <div style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: 6, 
              padding: 12, 
              minHeight: 80,
              backgroundColor: '#fafafa'
            }}>
              <Space size={[8, 8]} wrap>
                {portList.map((port) => (
                  <Tag
                    key={port}
                    closable
                    onClose={() => removePort(port)}
                    color="blue"
                    style={{ 
                      padding: '4px 8px',
                      fontSize: '14px',
                      lineHeight: '20px'
                    }}
                  >
                    {port}
                  </Tag>
                ))}
                {portList.length === 0 && (
                  <span style={{ color: '#999', fontStyle: 'italic' }}>
                    暂无端口配置，请添加端口
                  </span>
                )}
              </Space>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Comps;
