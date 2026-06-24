// 云函数：uploadImage - 上传图片到云存储
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event, context) => {
  const { filePath } = event
  // 此云函数为预留，实际图片上传在前端使用 wx.cloud.uploadFile
  // 如需服务端处理（如安全检测），可在此实现
  return { success: true, message: '图片上传功能请直接使用前端SDK' }
}
