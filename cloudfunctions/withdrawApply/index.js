// 云函数：withdrawApply - 提现申请
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { amount, account, accountType } = event

  if (!amount || amount <= 0) {
    return { success: false, message: '请输入有效金额' }
  }
  if (!account) {
    return { success: false, message: '请输入收款账号' }
  }

  try {
    // 查询用户余额
    const userRes = await db.collection('users').where({ _openid: openid }).get()
    if (userRes.data.length === 0) {
      return { success: false, message: '用户不存在' }
    }
    const user = userRes.data[0]

    if (user.balance < amount) {
      return { success: false, message: '余额不足' }
    }

    // 创建提现记录
    await db.collection('withdrawals').add({
      data: {
        playerOpenid: openid,
        amount,
        account,
        accountType: accountType || 'wechat',
        status: 'pending',
        createTime: db.serverDate(),
        processTime: null
      }
    })

    // 扣减余额
    await db.collection('users').doc(user._id).update({
      data: {
        balance: _.inc(-amount)
      }
    })

    return {
      success: true,
      message: '提现申请已提交',
      balance: parseFloat((user.balance - amount).toFixed(2))
    }
  } catch (err) {
    console.error('提现申请失败:', err)
    return { success: false, message: '操作失败，请重试' }
  }
}
