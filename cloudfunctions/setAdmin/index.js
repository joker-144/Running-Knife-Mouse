// 云函数：setAdmin - 用密码激活管理员身份
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const env = require('../../config/env.js')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { password } = event

  // 校验密码
  if (password !== env.ADMIN.PASSWORD) {
    return { success: false, message: '密码错误' }
  }

  try {
    await db.collection('users').where({ _openid: openid }).update({
      data: {
        role: 'admin',
        isVerified: true,
        verifyStatus: 'approved'
      }
    })

    return { success: true, message: '管理员身份已激活' }
  } catch (err) {
    console.error('设置管理员失败:', err)
    return { success: false, message: '操作失败' }
  }
}
