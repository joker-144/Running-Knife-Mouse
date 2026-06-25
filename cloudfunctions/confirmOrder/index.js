// 云函数：confirmOrder - 确认完成并结算
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

const PLATFORM_FEE_RATE = 0.05  // 平台抽成 5%

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { orderId } = event

  if (!orderId) {
    return { success: false, message: '缺少订单ID' }
  }

  try {
    // 获取订单
    const orderRes = await db.collection('orders').doc(orderId).get()
    if (!orderRes.data) {
      return { success: false, message: '订单不存在' }
    }
    const order = orderRes.data

    if (order.status !== 'completed') {
      return { success: false, message: '订单尚未完成' }
    }

    const isBoss = order._openid === openid
    const isPlayer = order.playerOpenid === openid

    if (!isBoss && !isPlayer) {
      return { success: false, message: '无权操作此订单' }
    }

    let updateData = { updateTime: db.serverDate() }

    if (isBoss) {
      if (order.bossConfirm) {
        return { success: false, message: '您已确认过' }
      }
      updateData.bossConfirm = true
    }

    if (isPlayer) {
      if (order.playerConfirm) {
        return { success: false, message: '您已确认过' }
      }
      updateData.playerConfirm = true
    }

    // 更新确认状态
    await db.collection('orders').doc(orderId).update({ data: updateData })

    // 检查是否双方都已确认
    const updatedOrder = await db.collection('orders').doc(orderId).get()
    const finalOrder = updatedOrder.data

    if (finalOrder.bossConfirm && finalOrder.playerConfirm) {
      // 双方确认，结算
      const platformFee = Math.round(order.price * PLATFORM_FEE_RATE * 100) / 100
      const earning = order.price - platformFee

      await db.collection('orders').doc(orderId).update({
        data: {
          status: 'settled',
          updateTime: db.serverDate()
        }
      })

      // 更新打手余额和统计
      if (order.playerOpenid) {
        const _ = db.command
        await db.collection('users').where({
          _openid: order.playerOpenid
        }).update({
          data: {
            balance: _.inc(earning),
            totalEarned: _.inc(earning),
            orderCount: _.inc(1)
          }
        })
      }

      return { success: true, message: '订单已结算', settled: true }
    }

    return { success: true, message: '确认成功，等待另一方确认' }
  } catch (err) {
    console.error('确认订单失败:', err)
    return { success: false, message: '操作失败，请重试' }
  }
}
