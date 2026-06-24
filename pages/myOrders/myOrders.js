// pages/myOrders/myOrders.js
const env = require('../../config/env.js')
const app = getApp()

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待接单' },
      { key: 'accepted', label: '已接单' },
      { key: 'ongoing', label: '进行中' },
      { key: 'completed', label: '已完成' },
      { key: 'settled', label: '已结算' },
      { key: 'cancelled', label: '已取消' }
    ],
    currentTab: 'all',
    orders: [],
    page: 1,
    hasMore: true,
    loading: false,
    refreshing: false,
    userRole: 'boss'
  },

  onShow() {
    const userInfo = app.globalData.userInfo
    this.setData({ userRole: userInfo?.role || 'boss' })
    this.resetAndLoad()
  },

  resetAndLoad() {
    this.setData({ page: 1, orders: [], hasMore: true })
    this.loadOrders()
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return
    this.setData({ currentTab: tab })
    this.resetAndLoad()
  },

  async loadOrders() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderList',
        data: {
          page: this.data.page,
          pageSize: env.PAGE_SIZE,
          filters: {
            status: this.data.currentTab === 'all' ? '' : this.data.currentTab,
            myOrders: true
          }
        }
      })

      if (res.result && res.result.success) {
        const newOrders = res.result.data || []
        this.setData({
          orders: this.data.page === 1 ? newOrders : [...this.data.orders, ...newOrders],
          hasMore: newOrders.length >= env.PAGE_SIZE,
          loading: false,
          refreshing: false
        })
      } else {
        this.setData({ loading: false, refreshing: false })
      }
    } catch (err) {
      console.error('加载订单失败:', err)
      this.setData({ loading: false, refreshing: false })
    }
  },

  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true, page: 1 })
    this.loadOrders()
    wx.stopPullDownRefresh()
  },

  goOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${orderId}` })
  }
})
