// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    openid: '',
    isLogin: false,
    role: 'boss',
    isVerified: false,
    verifyStatus: 'pending',
    stats: {
      orderCount: 0,
      totalEarned: 0,
      balance: 0,
      rating: 5.0,
      goodCount: 0,
      badCount: 0
    },
    pendingOrders: 0,
    loading: true,
    versionTapCount: 0,
    // 弹窗相关
    showNicknameModal: false,
    nicknameInput: '',
    showAdminModal: false,
    adminPasswordInput: ''
  },

  onShow() {
    this.loadUserData()
  },

  loadUserData() {
    const userInfo = app.globalData.userInfo
    const openid = app.globalData.openid

    if (userInfo && userInfo._id && openid) {
      this.setData({
        userInfo,
        isLogin: true,
        openid: openid,
        role: userInfo.role || 'boss',
        isVerified: userInfo.isVerified || false,
        verifyStatus: userInfo.verifyStatus || 'pending',
        stats: {
          orderCount: userInfo.orderCount || 0,
          totalEarned: userInfo.totalEarned || 0,
          balance: userInfo.balance || 0,
          rating: userInfo.rating || 5.0,
          goodCount: this.data.stats.goodCount || 0,
          badCount: this.data.stats.badCount || 0
        },
        loading: false
      })
      this.loadPendingCount()
      this.loadReviewStats()
    } else {
      this.setData({ loading: false })
    }
  },

  async loadPendingCount() {
    try {
      const db = wx.cloud.database()
      const _ = db.command
      const userInfo = this.data.userInfo

      let query = {}
      if (userInfo.role === 'boss') {
        query = {
          _openid: app.globalData.openid,
          status: _.in(['pending', 'accepted', 'ongoing'])
        }
      } else {
        query = {
          playerOpenid: app.globalData.openid,
          status: _.in(['accepted', 'ongoing'])
        }
      }

      const res = await db.collection('orders').where(query).count()
      this.setData({ pendingOrders: res.total || 0 })
    } catch (err) {
      console.error('加载订单数失败:', err)
    }
  },

  async loadReviewStats() {
    const openid = app.globalData.openid
    if (!openid) return
    try {
      const db = wx.cloud.database()
      const res = await db.collection('reviews')
        .where({ toOpenid: openid })
        .get()
      const all = res.data || []
      const goodCount = all.filter(r => r.rating >= 4).length
      const badCount = all.filter(r => r.rating <= 2).length
      this.setData({
        'stats.goodCount': goodCount,
        'stats.badCount': badCount
      })
    } catch (err) {
      console.error('加载评价统计失败:', err)
    }
  },

  // 登录
  onLogin() {
    const that = this
    wx.showModal({
      title: '选择您的角色',
      content: '您是想发布订单的"老板"，还是接单的"打手"？',
      confirmText: '我是打手',
      cancelText: '我是老板',
      success(res) {
        const role = res.confirm ? 'player' : 'boss'
        that.handleLogin(role)
      }
    })
  },

  async handleLogin(role) {
    wx.showLoading({ title: '登录中...', mask: true })
    try {
      if (!app.globalData.openid) {
        await app.doLogin()
      }
      const existingUser = await app.fetchUserInfo()

      if (!existingUser) {
        // 获取用户头像昵称（新版接口）
        await app.createUser({
          avatarUrl: '',
          nickName: role === 'boss' ? '老板' : '打手',
          role: role
        })
        await app.fetchUserInfo()
      }
      wx.hideLoading()
      this.loadUserData()
    } catch (err) {
      wx.hideLoading()
      console.error('登录失败:', err)
      wx.showToast({ title: '登录失败', icon: 'none' })
    }
  },

  // 获取头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    const userInfo = this.data.userInfo
    if (userInfo && userInfo._id) {
      const db = wx.cloud.database()
      db.collection('users').doc(userInfo._id).update({
        data: { avatarUrl }
      }).then(() => {
        userInfo.avatarUrl = avatarUrl
        app.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userInfo })
        wx.showToast({ title: '头像已更新', icon: 'success' })
      })
    }
  },

  // 编辑昵称（弹窗方式）
  editNickname() {
    this.setData({
      showNicknameModal: true,
      nicknameInput: this.data.userInfo?.nickName || ''
    })
  },

  // 关闭昵称弹窗
  hideNicknameModal() {
    this.setData({ showNicknameModal: false, nicknameInput: '' })
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({ nicknameInput: e.detail.value })
  },

  // 确认修改昵称
  async confirmNickname() {
    const nickName = this.data.nicknameInput.trim()
    if (!nickName) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    const userInfo = this.data.userInfo
    if (userInfo && userInfo._id) {
      const db = wx.cloud.database()
      try {
        await db.collection('users').doc(userInfo._id).update({
          data: { nickName }
        })
        userInfo.nickName = nickName
        app.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userInfo, showNicknameModal: false, nicknameInput: '' })
        wx.showToast({ title: '昵称已更新', icon: 'success' })
      } catch (err) {
        wx.showToast({ title: '更新失败', icon: 'none' })
      }
    }
  },

  // 切换角色
  onSwitchRole() {
    const roles = ['我是老板（发布订单）', '我是打手（接单赚钱）']
    const currentRole = this.data.role
    const currentIndex = currentRole === 'boss' ? 0 : 1

    wx.showActionSheet({
      itemList: roles,
      success: (res) => {
        const newRole = res.tapIndex === 0 ? 'boss' : 'player'
        if (newRole !== currentRole) {
          app.switchRole(newRole)
          this.loadUserData()
          wx.showToast({ title: '角色切换成功', icon: 'success' })
        }
      }
    })
  },

  // 点击好评/差评 → 跳转评价页面
  onTapRating() {
    wx.navigateTo({ url: '/pages/reviews/reviews?tab=good' })
  },

  onTapBadRating() {
    wx.navigateTo({ url: '/pages/reviews/reviews?tab=bad' })
  },

  // 点击订单数 → 跳转我的订单
  onTapOrders() {
    wx.navigateTo({ url: '/pages/myOrders/myOrders' })
  },

  // 点击余额/进行中
  onTapBalance() {
    if (this.data.role === 'player') {
      wx.navigateTo({ url: '/pages/withdraw/withdraw' })
    } else {
      wx.navigateTo({ url: '/pages/myOrders/myOrders' })
    }
  },

  // 导航
  goMyOrders() {
    wx.navigateTo({ url: '/pages/myOrders/myOrders' })
  },
  goVerify() {
    wx.navigateTo({ url: '/pages/verify/verify' })
  },
  goWithdraw() {
    wx.navigateTo({ url: '/pages/withdraw/withdraw' })
  },
  goPublish() {
    wx.navigateTo({ url: '/pages/orderPublish/orderPublish' })
  },
  goAdmin() {
    wx.navigateTo({ url: '/pages/admin/admin' })
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后需要重新登录，确定退出吗？',
      confirmColor: '#E74C3C',
      success: (res) => {
        if (res.confirm) {
          app.logout()
        }
      }
    })
  },

  // 连续点击版本号激活管理员
  onVersionTap() {
    const count = this.data.versionTapCount + 1
    this.setData({ versionTapCount: count })
    if (count >= 5) {
      this.setData({ versionTapCount: 0 })
      this.showAdminActivate()
    }
  },

  showAdminActivate() {
    this.setData({
      showAdminModal: true,
      adminPasswordInput: ''
    })
  },

  // 关闭管理员弹窗
  hideAdminModal() {
    this.setData({ showAdminModal: false, adminPasswordInput: '' })
  },

  // 管理员密码输入
  onAdminPasswordInput(e) {
    this.setData({ adminPasswordInput: e.detail.value })
  },

  // 确认激活管理员
  async confirmAdminActivate() {
    const password = this.data.adminPasswordInput.trim()
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    wx.showLoading({ title: '验证中...' })
    try {
      const result = await wx.cloud.callFunction({
        name: 'setAdmin',
        data: { password }
      })
      wx.hideLoading()
      if (result.result && result.result.success) {
        // 更新全局用户信息，确保 loadUserData 读到 admin 角色
        if (app.globalData.userInfo) {
          app.globalData.userInfo.role = 'admin'
          app.globalData.userInfo.isVerified = true
          app.globalData.userInfo.verifyStatus = 'approved'
          wx.setStorageSync('userInfo', app.globalData.userInfo)
        }
        this.setData({ showAdminModal: false, adminPasswordInput: '' })
        wx.showToast({ title: '管理员已激活', icon: 'success' })
        this.loadUserData()
      } else {
        wx.showToast({ title: result.result?.message || '验证失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: '网络错误', icon: 'none' })
    }
  },

  // 阻止弹窗冒泡
  stopPropagation() {}
})
