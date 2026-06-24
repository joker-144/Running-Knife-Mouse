// pages/verify/verify.js - 打手认证
const app = getApp()

Page({
  data: {
    form: {
      gameId: '',
      rank: '',
      seasonRank: '',
      description: ''
    },
    images: [],
    uploading: false,
    submitting: false,
    verifyStatus: null // null=未申请, pending=审核中, approved=已通过, rejected=已拒绝
  },

  onShow() {
    const userInfo = app.globalData.userInfo
    if (userInfo) {
      this.setData({
        verifyStatus: userInfo.verifyStatus || null,
        'form.gameId': userInfo.gameId || ''
      })
    }
  },

  // 输入
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  // 上传图片
  onChooseImage() {
    const that = this
    const maxCount = 4 - this.data.images.length
    if (maxCount <= 0) {
      wx.showToast({ title: '最多上传4张图片', icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        that.uploadImages(res.tempFiles)
      }
    })
  },

  async uploadImages(files) {
    this.setData({ uploading: true })
    try {
      const uploadTasks = files.map(file => {
        return new Promise((resolve, reject) => {
          const cloudPath = `verify/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
          wx.cloud.uploadFile({
            cloudPath,
            filePath: file.tempFilePath,
            success: res => resolve(res.fileID),
            fail: err => reject(err)
          })
        })
      })
      const results = await Promise.all(uploadTasks)
      this.setData({
        images: [...this.data.images, ...results],
        uploading: false
      })
    } catch (err) {
      this.setData({ uploading: false })
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({ images })
  },

  // 提交认证
  async onSubmit() {
    const { form } = this.data

    if (!form.gameId || form.gameId.trim() === '') {
      wx.showToast({ title: '请输入游戏ID', icon: 'none' })
      return
    }
    if (this.data.images.length === 0) {
      wx.showToast({ title: '请上传段位截图', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    try {
      const db = wx.cloud.database()
      const userInfo = app.globalData.userInfo

      await db.collection('users').doc(userInfo._id).update({
        data: {
          gameId: form.gameId,
          verifyStatus: 'pending',
          verifyImages: this.data.images,
          verifyRank: form.rank,
          verifySeasonRank: form.seasonRank,
          verifyDesc: form.description,
          verifyTime: db.serverDate()
        }
      })

      // 更新本地
      userInfo.verifyStatus = 'pending'
      userInfo.gameId = form.gameId
      app.globalData.userInfo = userInfo
      wx.setStorageSync('userInfo', userInfo)

      wx.hideLoading()
      wx.showToast({ title: '认证申请已提交', icon: 'success' })
      this.setData({
        verifyStatus: 'pending',
        submitting: false
      })

      setTimeout(() => wx.navigateBack(), 1500)
    } catch (err) {
      wx.hideLoading()
      this.setData({ submitting: false })
      console.error('提交失败:', err)
      wx.showToast({ title: '提交失败，请重试', icon: 'none' })
    }
  },

  // 撤销认证申请
  onCancelVerify() {
    const that = this
    wx.showModal({
      title: '撤销申请',
      content: '确定撤销认证申请吗？撤销后可重新提交。',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '撤销中...' })
        try {
          const db = wx.cloud.database()
          const userInfo = app.globalData.userInfo
          await db.collection('users').doc(userInfo._id).update({
            data: { verifyStatus: '' }
          })
          userInfo.verifyStatus = ''
          app.globalData.userInfo = userInfo
          wx.setStorageSync('userInfo', userInfo)
          wx.hideLoading()
          wx.showToast({ title: '已撤销申请', icon: 'success' })
          that.setData({ verifyStatus: '' })
        } catch (err) {
          wx.hideLoading()
          wx.showToast({ title: '撤销失败', icon: 'none' })
        }
      }
    })
  }
})
