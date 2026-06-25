// 云函数：getMessages - 获取聊天消息列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const PAGE_SIZE = 20    // 默认每页条数
const POLL_SIZE = 30    // 轮询最近条数

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId, page = 1, pageSize = PAGE_SIZE } = event

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
      for (const id of unreadIds) {
        await db.collection('messages').doc(id).update({
          data: { isRead: true }
        }).catch(() => {})
      }
    }

    // 转为正序（最旧→最新），客户端直接追加使用
    return {
      success: true,
      data: result.data.reverse()
    }
  } catch (err) {
    console.error('获取消息失败:', err)
    return { success: false, message: '加载失败', data: [] }
  }
}
