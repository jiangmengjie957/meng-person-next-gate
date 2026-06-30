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
import { BulbOutlined, PlusOutlined, DeleteOutlined, HolderOutlined, LinkOutlined } from "@ant-design/icons";
import styles from "./index.module.css";
import { copyToClipboard, guid } from "@/utils";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import _, { isEmpty } from 'lodash'
import { getBranch } from "@/service/getBranch";
import { getModels } from "@/apis/chat";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 确保dayjs使用中文
dayjs.locale('zh-cn');

// 安全的localStorage访问函数
const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  }
};

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
  const [modelList, setModelList] = useState<Array<{ id: string; description: string }>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [columnConfigOpen, setColumnConfigOpen] = useState(false);
  const [customColumns, setCustomColumns] = useState<Array<{ key: string; title: string }>>([]);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingCell, setEditingCell] = useState<{ recordId: string; columnKey: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const localDatabase = JSON.parse(safeLocalStorage.getItem("todoList") || "[]");
    if(isEmpty(database)) return
    if(!_.isEqual(localDatabase, database)) {
      safeLocalStorage.setItem("todoList", JSON.stringify(database))
    }
  },[database])

  useEffect(() => {
    const localDatabase = JSON.parse(safeLocalStorage.getItem("todoList") || "[]");
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
        releaseStatus: formData.releaseStatus || '待开发', // 设置默认值
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
    const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
    const ports = localConfig.portList || [];

    configForm.setFieldsValue({
      branchFormat: localConfig.branchFormat || "feature-xxx-xxx",
      customPrompt: localConfig.customPrompt || "",
    });
    setPortList(ports);
    setSelectedModel(localConfig.model || '');

    // 读取列顺序配置
    const savedColumnOrder = localConfig.columnOrder || [];
    if (savedColumnOrder.length > 0) {
      setColumnOrder(savedColumnOrder);
    } else {
      // 初始化默认列顺序
      const defaultOrder = ['index', 'title', 'description', 'releaseDate', 'releaseStatus', 'releasePort', 'preReleaseConfig', 'createAt'];
      setColumnOrder(defaultOrder);
    }

    // 先打开弹窗
    setConfigOpen(true);

    // 异步拉取模型列表
    setLoadingModels(true);
    getModels()
      .then((res) => {
        if (res.code === 200 && res.data?.models) {
          setModelList(res.data.models);
        }
      })
      .catch(() => {
        // 拉取失败不影响配置弹窗正常使用
      })
      .finally(() => {
        setLoadingModels(false);
      });
  };

  const onConfigSave = () => {
    const configData = {
      ...configForm.getFieldsValue(),
      portList: portList,
      columnOrder: columnOrder,
      ...(selectedModel ? { model: selectedModel } : {}),
    };
    // 保存到本地存储
    safeLocalStorage.setItem("todoConfig", JSON.stringify(configData));
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const onColumnConfig = () => {
    // 读取列顺序配置
    const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
    const savedColumnOrder = localConfig.columnOrder || [];
    const savedCustomColumns = localConfig.customColumns || [];

    if (savedColumnOrder.length > 0) {
      setColumnOrder(savedColumnOrder);
    } else {
      // 初始化默认列顺序
      const defaultOrder = ['index', 'title', 'description', 'releaseDate', 'releaseStatus', 'releasePort', 'preReleaseConfig', 'createAt'];
      setColumnOrder(defaultOrder);
    }

    setCustomColumns(savedCustomColumns);
    setColumnConfigOpen(true);
  };

  const onColumnConfigSave = () => {
    // 读取现有配置
    const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
    // 更新列顺序和自定义列
    localConfig.columnOrder = columnOrder;
    localConfig.customColumns = customColumns;
    // 保存回localStorage
    safeLocalStorage.setItem("todoConfig", JSON.stringify(localConfig));
    setColumnConfigOpen(false);
    message.success("列顺序配置保存成功");
  };

  const addCustomColumn = () => {
    if (!newColumnTitle.trim()) {
      message.warning("请输入列名称");
      return;
    }

    const columnKey = `custom_${guid()}`;
    const newColumn = { key: columnKey, title: newColumnTitle.trim() };

    const updatedCustomColumns = [...customColumns, newColumn];
    const updatedColumnOrder = [...columnOrder, columnKey];

    setCustomColumns(updatedCustomColumns);
    setColumnOrder(updatedColumnOrder);
    setNewColumnTitle('');

    // 立即保存到 localStorage
    const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
    localConfig.columnOrder = updatedColumnOrder;
    localConfig.customColumns = updatedCustomColumns;
    safeLocalStorage.setItem("todoConfig", JSON.stringify(localConfig));

    message.success("自定义列添加成功");
  };

  const removeCustomColumn = (columnKey: string) => {
    const updatedCustomColumns = customColumns.filter(col => col.key !== columnKey);
    const updatedColumnOrder = columnOrder.filter(key => key !== columnKey);

    setCustomColumns(updatedCustomColumns);
    setColumnOrder(updatedColumnOrder);

    // 立即保存到 localStorage
    const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
    localConfig.columnOrder = updatedColumnOrder;
    localConfig.customColumns = updatedCustomColumns;
    safeLocalStorage.setItem("todoConfig", JSON.stringify(localConfig));

    message.success("自定义列删除成功");
  };

  const startEditing = (recordId: string, columnKey: string, currentValue: string) => {
    setEditingCell({ recordId, columnKey });
    setEditingValue(currentValue || '');
  };

  const saveEditing = () => {
    if (editingCell) {
      setDatabase((data) =>
        data.map((item) =>
          item.id === editingCell.recordId
            ? { ...item, [editingCell.columnKey]: editingValue }
            : item
        )
      );
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleCellClick = (e: React.MouseEvent, text: string, recordId: string, columnKey: string) => {
    e.stopPropagation();

    if (clickTimer) {
      // 双击 - 取消单击定时器，进入编辑
      clearTimeout(clickTimer);
      setClickTimer(null);
      startEditing(recordId, columnKey, text);
    } else {
      // 单击 - 延迟200ms执行复制
      const timer = setTimeout(() => {
        if (text) {
          copyToClipboard(text); // copyToClipboard 内部已经有提示，不需要再加
        }
        setClickTimer(null);
      }, 200);
      setClickTimer(timer);
    }
  };

  const getColumnTitle = (key: string) => {
    const titleMap: Record<string, string> = {
      index: 'id',
      title: '需求标题',
      description: '分支名称',
      releaseDate: '发布计划',
      releaseStatus: '发布状态',
      releasePort: '发布端口',
      preReleaseConfig: '发布前配置',
      createAt: '创建时间',
    };

    // 如果是自定义列，从 customColumns 中查找
    if (key.startsWith('custom_')) {
      const customCol = customColumns.find(col => col.key === key);
      return customCol ? customCol.title : key;
    }

    return titleMap[key] || key;
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
      const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
      const branchFormat = localConfig.branchFormat || "feature-xxx-xxx";
      const customPrompt = localConfig.customPrompt || "";
      const model = localConfig.model || undefined;
      const branchName = await getBranch(title, {
        branchFormat,
        customPrompt,
        model,
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

  // 获取列顺序配置
  const getColumnOrder = () => {
    const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
    const savedOrder = localConfig.columnOrder || [];
    if (savedOrder.length > 0) {
      return savedOrder;
    }
    // 默认顺序
    return ['index', 'title', 'description', 'releaseDate', 'releaseStatus', 'releasePort', 'preReleaseConfig', 'createAt'];
  };

  // 获取自定义列配置
  const getCustomColumns = () => {
    const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
    return localConfig.customColumns || [];
  };

  // 定义所有列的配置
  const allColumnsConfig: Record<string, any> = {
    index: {
      title: 'id',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => {
        return database.length - ((currentPage - 1) * pageSize + index);
      },
    },
    title: {
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
    description: {
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
    releaseDate: {
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
    releaseStatus: {
      title: '发布状态',
      dataIndex: 'releaseStatus',
      key: 'releaseStatus',
      width: 100,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
        const statusList = ['待开发', '开发中', '待测试', '测试中', '待发布', '已发布'];

        return (
          <div style={{ padding: 8 }}>
            <Select
              placeholder="选择发布状态"
              value={selectedKeys[0]}
              onChange={(value) => setSelectedKeys(value ? [value] : [])}
              style={{ marginBottom: 8, display: 'block', width: '100%' }}
              allowClear
            >
              {statusList.map((status: string) => (
                <Select.Option key={status} value={status}>
                  {status}
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
        return record.releaseStatus === value;
      },
      render: (text: string) => {
        if (!text) return <Tag>待开发</Tag>;

        // 根据状态显示不同颜色
        const colorMap: Record<string, string> = {
          '待开发': 'default',
          '开发中': 'blue',
          '待测试': 'orange',
          '测试中': 'cyan',
          '待发布': 'purple',
          '已发布': 'green',
        };

        return <Tag color={colorMap[text] || 'default'}>{text}</Tag>;
      },
    },
    releasePort: {
      title: '发布端口',
      dataIndex: 'releasePort',
      key: 'releasePort',
      width: 100,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => {
        const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
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
    preReleaseConfig: {
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
    createAt: {
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
  };

  // 动态生成自定义列配置
  const customColumnsConfig = getCustomColumns().reduce((acc: Record<string, any>, col: { key: string; title: string }) => {
    acc[col.key] = {
      title: col.title,
      dataIndex: col.key,
      key: col.key,
      width: 200,
      render: (text: string, record: any) => {
        const isEditing = editingCell?.recordId === record.id && editingCell?.columnKey === col.key;

        if (isEditing) {
          return (
            <Input
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onPressEnter={saveEditing}
              onBlur={saveEditing}
              autoFocus
              style={{ width: '100%' }}
            />
          );
        }

        // 判断是否是网址
        const isUrl = text && /^(https?:\/\/|www\.)/i.test(text);

        return (
          <div
            onClick={(e) => handleCellClick(e, text, record.id, col.key)}
            style={{
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              minHeight: '24px',
              transition: 'background-color 0.2s',
              maxWidth: '180px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F5F5F5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            {isUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tooltip title={`${text} (单击复制)`}>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: '#1890FF',
                    }}
                  >
                    {text}
                  </span>
                </Tooltip>
                <Tooltip title="打开链接">
                  <a
                    href={text.startsWith('http') ? text : `https://${text}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ flexShrink: 0 }}
                  >
                    <LinkOutlined style={{ color: '#1890FF', fontSize: '14px' }} />
                  </a>
                </Tooltip>
              </div>
            ) : (
              <Tooltip title={text ? `${text} (单击复制，双击编辑)` : '双击编辑'}>
                <div
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {text || <span style={{ color: '#BFBFBF' }}>双击编辑</span>}
                </div>
              </Tooltip>
            )}
          </div>
        );
      },
    };
    return acc;
  }, {});

  // 合并所有列配置
  const allColumnsConfigMerged = { ...allColumnsConfig, ...customColumnsConfig };

  // 根据配置的顺序生成列数组
  const columns = [
    ...getColumnOrder().map((key: string) => allColumnsConfigMerged[key]).filter(Boolean),
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

  // 可拖拽的列项组件
  const SortableItem = ({ id }: { id: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      backgroundColor: '#ffffff',
      border: '1px solid #D1D9E6',
      borderRadius: '8px',
      padding: '12px 16px',
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'grab',
      boxShadow: isDragging ? '0 4px 12px rgba(24, 144, 255, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
    };

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <HolderOutlined style={{ color: '#1890FF', fontSize: '16px' }} />
          <span style={{ color: '#2C3E50', fontWeight: 500 }}>{getColumnTitle(id)}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.operation}>
        <Button type="primary" onClick={onAdd}>
          新增
        </Button>
        <Button onClick={onConfig} style={{ marginLeft: 8 }}>
          配置
        </Button>
        <Button onClick={onColumnConfig} style={{ marginLeft: 8 }}>
          列配置
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
          <Form.Item name="releaseStatus" label="发布状态" initialValue="待开发">
            <Select placeholder="请选择发布状态" style={{ width: '100%' }}>
              <Select.Option value="待开发">待开发</Select.Option>
              <Select.Option value="开发中">开发中</Select.Option>
              <Select.Option value="待测试">待测试</Select.Option>
              <Select.Option value="测试中">测试中</Select.Option>
              <Select.Option value="待发布">待发布</Select.Option>
              <Select.Option value="已发布">已发布</Select.Option>
            </Select>
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
                const localConfig = JSON.parse(safeLocalStorage.getItem("todoConfig") || "{}");
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

          <Form.Item label="AI模型选择">
            <Select
              placeholder="默认使用服务端配置的模型"
              value={selectedModel || undefined}
              onChange={(val) => setSelectedModel(val || '')}
              allowClear
              loading={loadingModels}
              disabled={loadingModels}
              notFoundContent={loadingModels ? '加载中...' : '暂无模型'}
              style={{ width: '100%' }}
            >
              {modelList.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.id}
                  {m.description ? <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>{m.description}</span> : null}
                </Select.Option>
              ))}
            </Select>
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

      {/* 列顺序配置弹窗 */}
      <Modal
        width={700}
        open={columnConfigOpen}
        destroyOnClose
        onCancel={() => setColumnConfigOpen(false)}
        onOk={onColumnConfigSave}
        title="列配置管理"
        okText="保存"
        cancelText="取消"
      >
        {/* 自定义列管理 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, fontSize: '14px', fontWeight: 500, color: '#2C3E50' }}>
            自定义列管理
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Input
              placeholder="输入列名称"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              onPressEnter={addCustomColumn}
              style={{ flex: 1 }}
            />
            <Button type="primary" onClick={addCustomColumn}>
              添加列
            </Button>
          </div>
          {customColumns.length > 0 && (
            <div style={{
              backgroundColor: '#FAFAFA',
              borderRadius: '6px',
              padding: '12px',
              border: '1px solid #E8E8E8'
            }}>
              <Space wrap>
                {customColumns.map((col) => (
                  <Tag
                    key={col.key}
                    closable
                    onClose={() => removeCustomColumn(col.key)}
                    color="blue"
                  >
                    {col.title}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </div>

        {/* 列顺序配置 */}
        <div>
          <div style={{ marginBottom: 12, fontSize: '14px', fontWeight: 500, color: '#2C3E50' }}>
            列顺序配置
          </div>
          <div style={{
            backgroundColor: '#F5F7FA',
            borderRadius: '8px',
            padding: '20px',
            minHeight: '300px'
          }}>
            <div style={{
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Tag color="#E6F7FF" style={{ color: '#1890FF', border: '1px solid #91D5FF', fontWeight: 500 }}>
                拖拽调整顺序
              </Tag>
              <span style={{ fontSize: '13px', color: '#8C8C8C' }}>
                操作列始终固定在最右侧
              </span>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columnOrder}
                strategy={verticalListSortingStrategy}
              >
                {columnOrder.map((key) => (
                  <SortableItem key={key} id={key} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Comps;
