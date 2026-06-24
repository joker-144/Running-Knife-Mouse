// 云函数：initDatabase - 一键初始化所有数据库集合
// 使用方式：上传并部署后，在云开发控制台「云函数」中点击「测试」运行一次即可
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const results = []

  // 集合列表及初始化数据
  const collections = [
    {
      name: 'users',
      sample: {
        _openid: 'init_sample',
        avatarUrl: '',
        nickName: '示例用户',
        role: 'boss',
        isVerified: false,
        verifyStatus: '',
        gameId: '',
        totalEarned: 0,
        balance: 0,
        rating: 5.0,
        orderCount: 0,
        createTime: new Date()
      }
    },
    {
      name: 'orders',
      sample: {
        _openid: 'init_sample',
        serviceType: 'run',
        map: '示例地图',
        requirement: '',
        expectedProfit: '',
        priceType: 'fixed',
        price: 0,
        contact: '',
        images: [],
        status: 'pending',
        playerOpenid: '',
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        bossConfirm: false,
        playerConfirm: false,
        createTime: new Date(),
        updateTime: new Date()
      }
    },
    {
      name: 'withdrawals',
      sample: {
        playerOpenid: 'init_sample',
        amount: 0,
        account: '',
        accountType: 'wechat',
        status: 'pending',
        createTime: new Date(),
        processTime: null
      }
    },
    {
      name: 'messages',
      sample: {
        orderId: 'init_sample',
        fromOpenid: 'init_sample',
        toOpenid: 'init_sample',
        content: '示例消息',
        type: 'text',
        isRead: false,
        createTime: new Date()
      }
    },
    {
      name: 'reviews',
      sample: {
        orderId: 'init_sample',
        fromOpenid: 'init_sample',
        toOpenid: 'init_sample',
        rating: 5,
        content: '示例评价',
        createTime: new Date()
      }
    }
  ]

  for (const col of collections) {
    try {
      // 检查集合是否已有数据
      const existingRes = await db.collection(col.name).count()
      if (existingRes.total > 0) {
        results.push({ collection: col.name, status: 'exists' })
        continue
      }
      
      // 插入示例数据以自动创建集合（保留数据，确保集合可见）
      await db.collection(col.name).add({ data: col.sample })
      results.push({ collection: col.name, status: 'ok' })
    } catch (err) {
      // 集合已存在时跳过
      results.push({ collection: col.name, status: 'exists' })
    }
  }

  return {
    success: true,
    message: '数据库初始化完成',
    results
  }
}
