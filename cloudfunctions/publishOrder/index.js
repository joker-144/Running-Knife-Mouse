// 云函数：publishOrder - 发布订单
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const {
    serviceType,
    map,
    requirement,
    expectedProfit,
    priceType,
    price,
    contact,
    images
  } = event

  // 参数校验
  if (!serviceType || !map || !price || !contact) {
    return { success: false, message: '缺少必要参数' }
  }
  if (!['run', 'escort', 'farm'].includes(serviceType)) {
    return { success: false, message: '无效的服务类型' }
  }
  if (!['fixed', 'hour'].includes(priceType)) {
    return { success: false, message: '无效的价格类型' }
  }
  if (typeof price !== 'number' || price <= 0) {
    return { success: false, message: '无效的价格' }
  }

  try {
    const result = await db.collection('orders').add({
      data: {
        _openid: openid,
        serviceType,
        map,
        requirement: requirement || '',
        expectedProfit: expectedProfit || '',
        priceType,
        price,
        contact,
        images: images || [],
        status: 'pending',
        playerOpenid: '',
        acceptedAt: null,
        startedAt: null,
        completedAt: null,
        bossConfirm: false,
        playerConfirm: false,
        createTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      data: { _id: result._id },
      message: '订单发布成功'
    }
  } catch (err) {
    console.error('发布订单失败:', err)
    return { success: false, message: '发布失败，请重试' }
  }
}
