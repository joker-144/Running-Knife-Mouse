// 云函数：updateOrderStatus - 更新订单状态
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 状态流转校验
const validTransitions = {
  'pending': ['accepted', 'cancelled'],
  'accepted': ['ongoing', 'cancelled'],
  'ongoing': ['completed'],
  'completed': ['settled'],
  'settled': [],
  'cancelled': []
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId, status } = event

  if (!orderId || !status) {
    return { success: false, message: '缺少必要参数' }
  }

  try {
    // 获取订单
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, message: '订单不存在' }
    }
    const order = orderRes.data

    // 校验状态流转
    const allowed = validTransitions[order.status] || []
    if (!allowed.includes(status)) {
      return { success: false, message: `不能从"${order.status}"变更为"${status}"` }
    }

    // 权限校验
    const isOwner = order._openid === openid
    const isPlayer = order.playerOpenid === openid

    let updateData = { status, updateTime: db.serverDate() }

    // 根据不同目标状态设置时间戳
    switch (status) {
      case 'ongoing':
        if (!isPlayer) return { success: false, message: '仅接单打手可开始服务' }
        updateData.startedAt = db.serverDate()
        break
      case 'completed':
        if (!isPlayer) return { success: false, message: '仅接单打手可申请完成' }
        updateData.completedAt = db.serverDate()
        break
      case 'cancelled':
        if (!isOwner) return { success: false, message: '仅发布者可取消' }
        break
    }

    await db.collection('orders').doc(orderId).update({ data: updateData })

    return { success: true, message: '状态更新成功' }
  } catch (err) {
    console.error('更新订单状态失败:', err)
    return { success: false, message: '操作失败，请重试' }
  }
}
