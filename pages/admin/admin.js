// pages/admin/admin.js - 管理员页面（审核打手认证）
const app = getApp()
const env = require('../../config/env.js')

Page({
  data: {
    pendingUsers: [],
    loading: true,
    isAdmin: false
  },

  onShow() {
    // 仅管理员可访问
    const userInfo = app.globalData.userInfo
    if (!userInfo || userInfo.role !== 'admin') {
      wx.showToast({ title: '无权限访问', icon: 'none' })
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1000)
      return
    }
    this.setData({ isAdmin: true })
    this.loadPendingUsers()
  },

  async loadPendingUsers() {
    this.setData({ loading: true })
    try {
      const db = wx.cloud.database()
      const res = await db.collection('users')
        .where({
          verifyStatus: 'pending',
          role: 'player',
          verifyImages: db.command.exists(true)  // 仅查询已提交截图的
        })
        .limit(env.ADMIN.PENDING_LIMIT)
        .get()
      this.setData({ pendingUsers: res.data || [], loading: false })
    } catch (err) {
      console.error('加载失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 审核通过
  async onApprove(e) {
    const userId = e.currentTarget.dataset.id
    wx.showLoading({ title: '处理中...' })
    try {
      const db = wx.cloud.database()
      await db.collection('users').doc(userId).update({
        data: {
          verifyStatus: 'approved',
          isVerified: true
        }
      })
      wx.hideLoading()
      wx.showToast({ title: '已通过认证', icon: 'success' })
      this.loadPendingUsers()
    } catch (err) {
      wx.hideLoading()
      console.error('操作失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 审核拒绝
  async onReject(e) {
    const userId = e.currentTarget.dataset.id
    wx.showModal({
      title: '拒绝认证',
      content: '确定拒绝该打手的认证申请吗？',
      confirmColor: '#E74C3C',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '处理中...' })
        try {
          const db = wx.cloud.database()
          await db.collection('users').doc(userId).update({
            data: {
              verifyStatus: 'rejected',
              isVerified: false
            }
          })
          wx.hideLoading()
          wx.showToast({ title: '已拒绝', icon: 'success' })
          this.loadPendingUsers()
        } catch (err) {
          wx.hideLoading()
          console.error('操作失败:', err)
          wx.showToast({ title: '操作失败', icon: 'none' })
        }
      }
    })
  },

  // 预览验证图片
  onPreviewImage(e) {
    const { url } = e.currentTarget.dataset
    const { images } = e.currentTarget.dataset
    wx.previewImage({ current: url, urls: images ? images.split(',') : [url] })
  }
})
