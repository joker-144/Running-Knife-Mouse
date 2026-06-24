// 云函数：getMessages - 获取聊天消息列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const env = require('../../config/env.js')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId, page = 1, pageSize = env.CHAT.PAGE_SIZE } = event

  if (!orderId) {
    return { success: false, message: '缺少订单ID' }
  }

  try {
    const skip = (page - 1) * pageSize
    const result = await db.collection('messages')
      .where({ orderId })
      .orderBy('createTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()

    // 标记消息为已读
    const unreadIds = result.data
      .filter(msg => msg.toOpenid === openid && !msg.isRead)
      .map(msg => msg._id)

    if (unreadIds.length > 0) {
      const _ = db.command
      for (const id of unreadIds) {
        await db.collection('messages').doc(id).update({
          data: { isRead: true }
        }).catch(() => {})
      }
    }

    return {
      success: true,
      data: result.data.reverse()
    }
  } catch (err) {
    console.error('获取消息失败:', err)
    return { success: false, message: '加载失败', data: [] }
  }
}
