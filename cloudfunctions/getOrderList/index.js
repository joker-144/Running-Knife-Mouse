// 云函数：getOrderList - 获取订单列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const PAGE_SIZE = 10

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { page = 1, pageSize = PAGE_SIZE, filters = {} } = event

  try {
    let query = {}

    // 筛选条件：服务类型
    if (filters.serviceType) {
      query.serviceType = filters.serviceType
    }

    // 筛选条件：地图
    if (filters.map) {
      query.map = filters.map
    }

    // 筛选条件：价格
    if (filters.priceMin || filters.priceMax) {
      query.price = {}
      if (filters.priceMin) {
        query.price = _.gte(parseFloat(filters.priceMin))
      }
      if (filters.priceMax) {
        query.price = _.and(query.price, _.lte(parseFloat(filters.priceMax)))
      }
    }

    // 筛选条件：状态
    if (filters.status) {
      query.status = filters.status
    }

    // 我的订单
    if (filters.myOrders) {
      query = _.or([
        { _openid: openid },
        { playerOpenid: openid }
      ])
      if (filters.status) {
        const statusFilter = filters.status
        query = _.and([
          _.or([
            { _openid: openid },
            { playerOpenid: openid }
          ]),
          { status: statusFilter }
        ])
      }
    }

    const skip = (page - 1) * pageSize
    const result = await db.collection('orders')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
  } catch (err) {
    console.error('获取订单列表失败:', err)
    return { success: false, message: '加载失败', data: [] }
  }
}
