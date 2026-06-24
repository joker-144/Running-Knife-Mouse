// pages/orderDetail/orderDetail.js
const util = require('../../utils/util.js')
const env = require('../../config/env.js')
const app = getApp()

Page({
  data: {
    orderId: '',
    order: null,
    loading: true,
    isOwner: false,
    isPlayer: false,
    userRole: 'boss',
    canAccept: false,
    canStart: false,
    canComplete: false,
    canConfirm: false,
    canCancel: false
  },

  onLoad(options) {
    this.setData({ orderId: options.id || '' })
    if (!this.data.orderId) {
      wx.showToast({ title: '订单ID无效', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
  },

  onShow() {
    if (app.globalData.openid) {
      this.loadOrderDetail()
    } else {
      this.initApp()
    }
  },

  async initApp() {
    try {
      await app.doLogin()
      await app.fetchUserInfo()
      this.loadOrderDetail()
    } catch (err) {
      console.error('初始化失败:', err)
    }
  },

  async loadOrderDetail() {
    this.setData({ loading: true })
    const db = wx.cloud.database()

    try {
      const res = await db.collection('orders').doc(this.data.orderId).get()
      if (!res.data) {
        wx.showToast({ title: '订单不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 1500)
        return
      }

      const order = res.data
      const userInfo = app.globalData.userInfo
      const openid = app.globalData.openid
      const role = userInfo?.role || 'boss'

      // 判断权限
      const isOwner = order._openid === openid
      const isPlayer = order.playerOpenid === openid
      const canAccept = role === 'player' && 
                        userInfo?.isVerified && 
                        order.status === 'pending'
      const canStart = isPlayer && order.status === 'accepted'
      const canComplete = isPlayer && order.status === 'ongoing'
      const canConfirm = isOwner && order.status === 'completed' && !order.bossConfirm
      const canCancel = isOwner && ['pending', 'accepted'].includes(order.status)

      this.setData({
        order,
        isOwner,
        isPlayer,
        userRole: role,
        canAccept,
        canStart,
        canComplete,
        canConfirm,
        canCancel,
        loading: false
      })
    } catch (err) {
      console.error('加载订单详情失败:', err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 接单
  async onAcceptOrder() {
    const that = this
    const order = this.data.order
    const typeName = order.serviceType === 'run' ? '跑刀' : order.serviceType === 'escort' ? '护航' : '代肝'
    wx.showModal({
      title: '确认接取订单',
      content: `【${typeName}】${order.map}\n价格：¥${order.price}${order.priceType === 'hour' ? '/小时' : ''}\n\n接单后请尽快联系老板开始服务。\n确认接取此订单？`,
      confirmText: '确认接取',
      success: async (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '接单中...', mask: true })
        try {
          const result = await wx.cloud.callFunction({
            name: 'acceptOrder',
            data: { orderId: that.data.orderId }
          })

          wx.hideLoading()
          if (result.result && result.result.success) {
            wx.showToast({ title: '接单成功', icon: 'success' })
            that.loadOrderDetail()
          } else {
            wx.showToast({ title: result.result?.message || '接单失败', icon: 'none' })
          }
        } catch (err) {
          wx.hideLoading()
          console.error('接单失败:', err)
          wx.showToast({ title: '接单失败', icon: 'none' })
        }
      }
    })
  },

  // 开始服务
  async onStartService() {
    wx.showLoading({ title: '操作中...', mask: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateOrderStatus',
        data: {
          orderId: this.data.orderId,
          status: 'ongoing'
        }
      })

      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: '服务已开始', icon: 'success' })
        this.loadOrderDetail()
      } else {
        wx.showToast({ title: res.result?.message || '操作失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('操作失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 申请完成
  async onCompleteOrder() {
    wx.showLoading({ title: '操作中...', mask: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'updateOrderStatus',
        data: {
          orderId: this.data.orderId,
          status: 'completed'
        }
      })

      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: '已申请完成，等待老板确认', icon: 'success' })
        this.loadOrderDetail()
      } else {
        wx.showToast({ title: res.result?.message || '操作失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('操作失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  // 确认完成
  async onConfirmOrder() {
    const that = this
    wx.showModal({
      title: '确认完成',
      content: '确认订单已完成？确认后打手将获得收益。',
      success: async (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '确认中...', mask: true })
        try {
          const result = await wx.cloud.callFunction({
            name: 'confirmOrder',
            data: { orderId: that.data.orderId }
          })

          wx.hideLoading()
          if (result.result && result.result.success) {
            wx.showToast({ title: '订单已结算', icon: 'success' })
            that.loadOrderDetail()
          } else {
            wx.showToast({ title: result.result?.message || '操作失败', icon: 'none' })
          }
        } catch (err) {
          wx.hideLoading()
          console.error('确认失败:', err)
          wx.showToast({ title: '确认失败', icon: 'none' })
        }
      }
    })
  },

  // 取消订单
  async onCancelOrder() {
    const that = this
    wx.showModal({
      title: '取消订单',
      content: '确定要取消此订单吗？此操作不可撤销。',
      confirmColor: '#E74C3C',
      success: async (res) => {
        if (!res.confirm) return

        wx.showLoading({ title: '取消中...', mask: true })
        try {
          const result = await wx.cloud.callFunction({
            name: 'updateOrderStatus',
            data: {
              orderId: that.data.orderId,
              status: 'cancelled'
            }
          })

          wx.hideLoading()
          if (result.result && result.result.success) {
            wx.showToast({ title: '订单已取消', icon: 'success' })
            that.loadOrderDetail()
          } else {
            wx.showToast({ title: result.result?.message || '操作失败', icon: 'none' })
          }
        } catch (err) {
          wx.hideLoading()
          console.error('取消失败:', err)
          wx.showToast({ title: '取消失败', icon: 'none' })
        }
      }
    })
  },

  // 联系对方
  onContact() {
    const { order } = this.data
    if (!order.contact) {
      wx.showToast({ title: '未提供联系方式', icon: 'none' })
      return
    }
    wx.makePhoneCall({ phoneNumber: order.contact })
  },

  // 跳转聊天
  goChat() {
    wx.navigateTo({ url: `/pages/chat/chat?orderId=${this.data.orderId}` })
  },

  // 预览图片
  onPreviewImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      current: url,
      urls: this.data.order.images || []
    })
  }
})
