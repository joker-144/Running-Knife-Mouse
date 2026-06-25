// pages/orderHall/orderHall.js
const env = require('../../config/env.js')
const app = getApp()

Page({
  data: {
    // 筛选条件
    filters: {
      serviceType: '',
      map: '',
      priceMin: '',
      priceMax: '',
      status: 'pending'
    },

    // 服务类型筛选
    serviceTypes: [
      { value: '', label: '全部' },
      { value: 'run', label: '跑刀' },
      { value: 'escort', label: '护航' },
      { value: 'farm', label: '代肝' }
    ],

    // 地图列表
    mapList: env.MAP_LIST,

    // 订单列表
    orders: [],
    page: 1,
    hasMore: true,
    loading: false,
    refreshing: false,

    // 筛选面板
    showFilterPanel: false,
    mapFilterIndex: -1,
    userRole: 'boss',
    isLogin: false
  },

  onLoad() {
    const userInfo = app.globalData.userInfo
    this.setData({
      userRole: userInfo?.role || 'boss',
      isLogin: !!app.globalData.openid && !!userInfo
    })
  },

  onShow() {
    const userInfo = app.globalData.userInfo
    const isLogin = !!app.globalData.openid && !!userInfo
    this.setData({
      userRole: userInfo?.role || 'boss',
      isLogin: isLogin
    })
    if (isLogin) {
      this.resetAndLoad()
    }
  },

  // 手动登录
  startLogin() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  // 重置并加载
  resetAndLoad() {
    this.setData({ page: 1, orders: [], hasMore: true })
    this.loadOrders()
  },

  // 加载订单列表
  async loadOrders() {
    if (this.data.loading || !this.data.hasMore) return

    this.setData({ loading: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrderList',
        data: {
          page: this.data.page,
          pageSize: env.PAGE_SIZE,
          filters: this.data.filters
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
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // 加载更多
  onLoadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadOrders()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true, page: 1 })
    this.loadOrders()
    wx.stopPullDownRefresh()
  },

  // 服务类型筛选
  onServiceTypeFilter(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ 'filters.serviceType': type })
    this.resetAndLoad()
  },

  // 地图筛选
  onMapSelect(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    const map = index === -1 ? '' : env.MAP_LIST[index]
    this.setData({
      mapFilterIndex: index,
      'filters.map': map
    })
    this.resetAndLoad()
  },

  // 切换筛选面板
  toggleFilterPanel() {
    this.setData({ showFilterPanel: !this.data.showFilterPanel })
  },

  // 价格筛选
  onPriceMinInput(e) {
    this.setData({ 'filters.priceMin': e.detail.value })
  },
  onPriceMaxInput(e) {
    this.setData({ 'filters.priceMax': e.detail.value })
  },

  // 应用筛选
  applyFilters() {
    this.setData({ showFilterPanel: false })
    this.resetAndLoad()
  },

  // 重置筛选
  resetFilters() {
    this.setData({
      filters: {
        serviceType: '',
        map: '',
        priceMin: '',
        priceMax: '',
        status: 'pending'
      },
      mapFilterIndex: -1,
      showFilterPanel: false
    })
    this.resetAndLoad()
  },

  // 导航到订单详情
  goOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${orderId}` })
  },

  // 导航到发布订单
  goPublish() {
    wx.navigateTo({ url: '/pages/orderPublish/orderPublish' })
  }
})
