// app.js
const env = require('./config/env.js')

App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: env.CLOUD_ENV_ID,
        traceUser: true
      })
    }

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    this.globalData.statusBarHeight = systemInfo.statusBarHeight
    this.globalData.navBarHeight = systemInfo.platform === 'android' ? 48 : 44

    // 检查登录状态
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo._id) {
      this.globalData.userInfo = userInfo
      this.globalData.isLogin = true
    }
  },

  // 获取openid并登录
  async doLogin() {
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: '登录中...', mask: true })

      // 先调用云函数获取 openid
      wx.cloud.callFunction({
        name: 'login',
        data: {}
      }).then(res => {
        wx.hideLoading()
        if (res.result && res.result.openid) {
          this.globalData.openid = res.result.openid
          resolve(res.result)
        } else {
          // 云函数返回异常
          const err = new Error('获取openid失败，请确认云函数已部署')
          wx.showToast({ title: err.message, icon: 'none', duration: 3000 })
          reject(err)
        }
      }).catch(err => {
        wx.hideLoading()
        console.error('登录失败:', err)
        // 根据错误类型给出明确提示
        let msg = '登录失败，请检查：\n1.云函数login是否已部署\n2.云开发环境ID是否正确'
        if (err.errCode === -1) {
          msg = '云开发未初始化，请检查环境ID'
        } else if (err.errCode === -404011) {
          msg = '云函数login未部署，请在开发者工具中上传'
        }
        wx.showModal({
          title: '登录失败',
          content: msg,
          showCancel: false
        })
        reject(err)
      })
    })
  },

  // 获取/创建用户信息
  async fetchUserInfo() {
    const db = wx.cloud.database()
    const openid = this.globalData.openid

    if (!openid) return null

    try {
      const res = await db.collection('users').where({
        _openid: openid
      }).get()

      if (res.data && res.data.length > 0) {
        const userInfo = res.data[0]
        this.globalData.userInfo = userInfo
        this.globalData.isLogin = true
        wx.setStorageSync('userInfo', userInfo)
        return userInfo
      }
      return null
    } catch (err) {
      console.error('获取用户信息失败:', err)
      // 集合不存在时给出提示
      if (err.errCode === -502005) {
        wx.showModal({
          title: '数据库未初始化',
          content: '请在云开发控制台中创建 users 集合',
          showCancel: false
        })
      }
      return null
    }
  },

  // 创建新用户
  async createUser(data) {
    const db = wx.cloud.database()
    try {
      const res = await db.collection('users').add({
        data: {
          avatarUrl: data.avatarUrl || '',
          nickName: data.nickName || '跑刀鼠用户',
          role: data.role || 'boss',
          isVerified: false,
          verifyStatus: '',       // 空字符串=未申请，pending=已提交审核
          gameId: '',
          totalEarned: 0,
          balance: 0,
          rating: 5.0,
          orderCount: 0,
          createTime: db.serverDate()
        }
      })
      return res
    } catch (err) {
      console.error('创建用户失败:', err)
      throw err
    }
  },

  // 退出登录
  logout() {
    this.globalData.userInfo = null
    this.globalData.isLogin = false
    this.globalData.openid = ''
    // 标记已退出，阻止自动登录
    this.globalData.justLoggedOut = true
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    // 使用 reLaunch 强制清除所有页面缓存
    wx.reLaunch({
      url: '/pages/index/index',
      success: () => {
        // 延迟显示 toast，等页面渲染完
        setTimeout(() => {
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }, 500)
      }
    })
  },

  // 切换角色
  switchRole(role) {
    const userInfo = this.globalData.userInfo
    if (userInfo && userInfo.role !== role) {
      userInfo.role = role
      this.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)
      // 更新数据库
      const db = wx.cloud.database()
      db.collection('users').doc(userInfo._id).update({
        data: { role: role }
      }).catch(err => console.error('更新角色失败:', err))
    }
  },

  globalData: {
    userInfo: null,
    isLogin: false,
    openid: '',
    systemInfo: null,
    statusBarHeight: 0,
    navBarHeight: 44
  }
})
