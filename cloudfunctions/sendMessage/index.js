// 云函数：sendMessage - 发送聊天消息
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId, content, type = 'text' } = event

  if (!orderId || !content) {
    return { success: false, message: '缺少必要参数' }
  }

  try {
    // 获取订单信息以确定对方openid
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, message: '订单不存在' }
    }
    const order = orderRes.data

    // 确定接收方
    let toOpenid = ''
    if (order._openid === openid) {
      toOpenid = order.playerOpenid || ''  // 可能暂无打手
    } else if (order.playerOpenid === openid) {
      toOpenid = order._openid
    } else {
      return { success: false, message: '无权在此订单发送消息' }
    }

    const msgData = {
      orderId,
      fromOpenid: openid,
      toOpenid,
      content,
      type,
      isRead: false,
      createTime: db.serverDate()
    }

    const result = await db.collection('messages').add({ data: msgData })

    return {
      success: true,
      data: {
        _id: result._id,
        orderId,
        fromOpenid: openid,
        toOpenid,
        content,
        type,
        createTime: new Date()
      }
    }
  } catch (err) {
    console.error('发送消息失败:', err)
    return { success: false, message: '发送失败' }
  }
}
