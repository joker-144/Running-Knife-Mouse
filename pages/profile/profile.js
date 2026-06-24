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
      rating: 5.0
    },
    pendingOrders: 0,
    loading: true,
    versionTapCount: 0
  },

  onShow() {
    this.loadUserData()
  },

  loadUserData() {
    const userInfo = app.globalData.userInfo

    if (userInfo && userInfo._id) {
      this.setData({
        userInfo,
        isLogin: true,
        openid: app.globalData.openid,
        role: userInfo.role || 'boss',
        isVerified: userInfo.isVerified || false,
        verifyStatus: userInfo.verifyStatus || 'pending',
        stats: {
          orderCount: userInfo.orderCount || 0,
          totalEarned: userInfo.totalEarned || 0,
          balance: userInfo.balance || 0,
          rating: userInfo.rating || 5.0
        },
        loading: false
      })
      this.loadPendingCount()
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

  // 编辑昵称（弹窗方式，避免自动弹键盘）
  editNickname() {
    const that = this
    wx.showModal({
      title: '设置昵称',
      editable: true,
      placeholderText: '请输入昵称',
      content: '',
      success: async (res) => {
        if (!res.confirm || !res.content) return
        const nickName = res.content.trim()
        const userInfo = that.data.userInfo
        if (userInfo && userInfo._id) {
          const db = wx.cloud.database()
          try {
            await db.collection('users').doc(userInfo._id).update({
              data: { nickName }
            })
            userInfo.nickName = nickName
            app.globalData.userInfo = userInfo
            wx.setStorageSync('userInfo', userInfo)
            that.setData({ userInfo })
            wx.showToast({ title: '昵称已更新', icon: 'success' })
          } catch (err) {
            wx.showToast({ title: '更新失败', icon: 'none' })
          }
        }
      }
    })
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
    const that = this
    wx.showModal({
      title: '激活管理员',
      content: '请输入管理员激活密码',
      editable: true,
      placeholderText: '请输入密码',
      success: async (res) => {
        if (!res.confirm || !res.content) return
        wx.showLoading({ title: '验证中...' })
        try {
          const result = await wx.cloud.callFunction({
            name: 'setAdmin',
            data: { password: res.content }
          })
          wx.hideLoading()
          if (result.result && result.result.success) {
            wx.showToast({ title: '管理员已激活', icon: 'success' })
            that.loadUserData()
          } else {
            wx.showToast({ title: result.result?.message || '验证失败', icon: 'none' })
          }
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '网络错误', icon: 'none' })
        }
      }
    })
  }
})
