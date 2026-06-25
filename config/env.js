// config/env.js - 环境配置文件
module.exports = {
  // 云开发环境 ID，请在微信开发者工具中替换为你的环境ID
  CLOUD_ENV_ID: 'cloudbase-d6gcx23kbd0cb49eb',

  // 平台抽成比例（5%）
  PLATFORM_FEE_RATE: 0.05,

  // 分页配置
  PAGE_SIZE: 10,

  // 订单状态映射
  ORDER_STATUS: {
    pending: '待接单',
    accepted: '已接单',
    ongoing: '进行中',
    completed: '已完成',
    settled: '已结算',
    cancelled: '已取消'
  },

  // 服务类型映射
  SERVICE_TYPE: {
    run: '跑刀',
    escort: '护航',
    farm: '代肝'
  },

  // 地图列表（三角洲行动实际地图）
  MAP_LIST: [
    '零号大坝（普通）',
    '机密大坝',
    '长弓溪谷',
    '机密长弓',
    '机密航天',
    '绝密航天',
    '机密巴克什',
    '绝密巴克什'
  ],

  // 验证状态映射
  VERIFY_STATUS: {
    pending: '审核中',
    approved: '已认证',
    rejected: '已拒绝'
  },

  // 提现相关配置
  WITHDRAW: {
    MIN_AMOUNT: 10,           // 最低提现金额（元）
    MAX_RECORDS: 20,          // 提现记录查询条数
    FEE_RATE: 0               // 提现手续费率（0=免手续费）
  },

  // 聊天相关配置
  CHAT: {
    POLL_INTERVAL: 5000,      // 消息轮询间隔（毫秒）
    PAGE_SIZE: 20,            // 消息列表每页条数
    POLL_SIZE: 5,             // 轮询时拉取的最新消息条数
    SCROLL_DELAY: 100         // 滚动到底部延迟（毫秒）
  },

  // 首页数据配置
  INDEX: {
    HOT_PLAYERS_LIMIT: 6,     // 推荐打手显示数量
    RECENT_ORDERS_LIMIT: 5    // 最新订单显示数量
  },

  // 管理员页面配置
  ADMIN: {
    PENDING_LIMIT: 50,        // 待审核用户查询条数
    PASSWORD: 'admin'  // 管理员激活密码（请修改为强密码）
  }
}
