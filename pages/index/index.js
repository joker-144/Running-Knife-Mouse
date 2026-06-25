// pages/index/index.js
const util = require('../../utils/util.js')
const env = require('../../config/env.js')
const app = getApp()

Page({
  data: {
    banners: [
      { id: 1, image: '', title: '三角洲行动跑刀平台', desc: '专业打手 · 安全高效' },
      { id: 2, image: '', title: '打手入驻火热招募中', desc: '认证打手享专属收益保障' },
      { id: 3, image: '', title: '新人首单立享优惠', desc: '注册即享专属福利' }
    ],
    currentBanner: 0,
    hotPlayers: [],
    recentOrders: [],
    userRole: 'boss',
    isVerified: false,
    userAvatar: '',
    userNickName: '跑刀鼠用户',
    isLogin: false,
    loading: true,
    showNicknameModal: false,
    nicknameInput: ''
  },

  onLoad() {
    this.setData({ userRole: app.globalData.userInfo?.role || 'boss' })
  },

  onShow() {
    // 刚退出登录，显示未登录界面
    if (app.globalData.justLoggedOut) {
      app.globalData.justLoggedOut = false
      this.setData({
        isLogin: false,
        userRole: 'boss',
        isVerified: false,
        userAvatar: '',
        userNickName: '跑刀鼠用户',
        loading: false
      })
      return
    }

    const userInfo = app.globalData.userInfo
    const isLogin = !!app.globalData.openid && !!userInfo
    this.setData({
      isLogin: isLogin,
      userRole: userInfo?.role || 'boss',
      isVerified: userInfo?.isVerified || false,
      userAvatar: userInfo?.avatarUrl || '',
      userNickName: userInfo?.nickName || '跑刀鼠用户'
    })
    
    if (isLogin) {
      this.loadData()
    } else {
      this.setData({ isLogin: false, loading: false })
    }
  },

  // 手动登录按钮
  startLogin() {
    this.setData({ loading: true })
    this.initApp()
  },

  async initApp() {
    try {
      if (!app.globalData.openid) {
        await app.doLogin()
      }
      const userInfo = await app.fetchUserInfo()
      
      if (!userInfo) {
        // 新用户，显示角色选择
        this.showRolePicker()
      } else {
        this.setData({
          isLogin: true,
          userRole: userInfo.role,
          isVerified: userInfo.isVerified || false,
          userAvatar: userInfo.avatarUrl || '',
          userNickName: userInfo.nickName || '跑刀鼠用户'
        })
      }
      this.setData({ loading: false })
      // 加载数据（不阻塞）
      this.loadData()
    } catch (err) {
      this.setData({ isLogin: false, loading: false })
      console.error('初始化失败:', err)
    }
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      await Promise.all([
        this.loadHotPlayers(),
        this.loadRecentOrders()
      ])
    } catch (err) {
      console.error('加载数据失败:', err)
    }
    this.setData({ loading: false })
  },

  async loadHotPlayers() {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('users')
        .where({
          isVerified: true,
          role: 'player'
        })
        .orderBy('rating', 'desc')
        .limit(env.INDEX.HOT_PLAYERS_LIMIT)
        .get()
      this.setData({ hotPlayers: res.data || [] })
    } catch (err) {
      console.error('加载打手列表失败:', err)
    }
  },

  async loadRecentOrders() {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('orders')
        .where({
          status: db.command.in(['pending', 'ongoing'])
        })
        .orderBy('createTime', 'desc')
        .limit(env.INDEX.RECENT_ORDERS_LIMIT)
        .get()
      this.setData({ recentOrders: res.data || [] })
    } catch (err) {
      console.error('加载订单列表失败:', err)
    }
  },

  showRolePicker() {
    const that = this
    wx.showModal({
      title: '选择您的角色',
      content: '您是想发布订单的"老板"，还是接单的"打手"？',
      confirmText: '我是打手',
      cancelText: '我是老板',
      success(res) {
        const role = res.confirm ? 'player' : 'boss'
        that.createUserProfile(role)
      }
    })
  },

  async createUserProfile(role) {
    wx.showLoading({ title: '创建账户...' })
    try {
      // 新版API：不在首次注册时获取头像昵称，用户可在个人中心设置
      await app.createUser({
        avatarUrl: '',
        nickName: role === 'boss' ? '老板' : '打手',
        role: role
      })
      
      await app.fetchUserInfo()
      this.setData({ userRole: role })
      wx.hideLoading()
      wx.showToast({ title: '账户创建成功', icon: 'success' })
      // 引导设置昵称
      setTimeout(() => {
        this.promptSetNickname()
      }, 1000)
      this.loadData()
    } catch (err) {
      wx.hideLoading()
      console.error('创建用户失败:', err)
      wx.showToast({ title: '创建失败，请检查数据库集合是否已创建', icon: 'none', duration: 3000 })
    }
  },

  // ====== 昵称设置弹窗 ======
  // 首次登录引导设置昵称
  promptSetNickname() {
    this.setData({
      showNicknameModal: true,
      nicknameInput: ''
    })
  },

  hideNicknameModal() {
    this.setData({ showNicknameModal: false, nicknameInput: '' })
  },

  onNicknameInput(e) {
    this.setData({ nicknameInput: e.detail.value })
  },

  async confirmNickname() {
    const nickName = this.data.nicknameInput.trim()
    if (!nickName) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    const userInfo = app.globalData.userInfo
    if (userInfo && userInfo._id) {
      const db = wx.cloud.database()
      try {
        await db.collection('users').doc(userInfo._id).update({
          data: { nickName }
        })
        userInfo.nickName = nickName
        app.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userNickName: nickName, showNicknameModal: false, nicknameInput: '' })
        wx.showToast({ title: '昵称已设置', icon: 'success' })
      } catch (err) {
        wx.showToast({ title: '设置失败', icon: 'none' })
      }
    }
  },

  stopPropagation() {},

  // 切换到打手
  switchToPlayer() {
    app.switchRole('player')
    this.setData({ userRole: 'player', isVerified: app.globalData.userInfo?.isVerified || false })
    wx.showToast({ title: '已切换为打手', icon: 'success' })
    this.loadData()
  },

  // 切换到老板
  switchToBoss() {
    app.switchRole('boss')
    this.setData({ userRole: 'boss' })
    wx.showToast({ title: '已切换为老板', icon: 'success' })
    this.loadData()
  },

  // 轮播图切换
  onBannerChange(e) {
    this.setData({ currentBanner: e.detail.current })
  },

  // 导航到发布订单（仅老板）
  goPublish() {
    if (this.data.userRole !== 'boss') {
      wx.showToast({ title: '仅老板可发布订单', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/orderPublish/orderPublish' })
  },

  // 打手认证
  goVerify() {
    wx.navigateTo({ url: '/pages/verify/verify' })
  },

  // 我的订单
  goMyOrders() {
    wx.navigateTo({ url: '/pages/myOrders/myOrders' })
  },

  // 导航到订单大厅
  goOrderHall() {
    wx.switchTab({ url: '/pages/orderHall/orderHall' })
  },

  // 导航到打手详情
  goPlayerDetail(e) {
    const playerId = e.currentTarget.dataset.id
    wx.showToast({ title: '打手详情开发中', icon: 'none' })
  },

  // 导航到订单详情
  goOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/orderDetail/orderDetail?id=${orderId}` })
  },

  // 导航到管理后台
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
