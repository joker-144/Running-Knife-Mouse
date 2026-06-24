// 云函数：acceptOrder - 打手抢单
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId } = event

  if (!orderId) {
    return { success: false, message: '缺少订单ID' }
  }

  try {
    // 检查打手是否认证
    const userRes = await db.collection('users').where({ _openid: openid }).get()
    if (userRes.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    const user = userRes.data[0]
    if (!user.isVerified) {
      return { success: false, message: '请先完成打手认证' }
    }
    if (user.role !== 'player') {
      return { success: false, message: '仅打手可接单' }
    }

    // 检查订单状态
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, message: '订单不存在' }
    }
    const order = orderRes.data
    if (order.status !== 'pending') {
      return { success: false, message: '订单已被接取或已过期' }
    }
    if (order._openid === openid) {
      return { success: false, message: '不能接自己的订单' }
    }

    // 更新订单
    await db.collection('orders').doc(orderId).update({
      data: {
        playerOpenid: openid,
        status: 'accepted',
        acceptedAt: db.serverDate(),
        updateTime: db.serverDate()
      }
    })

    return { success: true, message: '接单成功' }
  } catch (err) {
    console.error('接单失败:', err)
    return { success: false, message: '接单失败，请重试' }
  }
}
