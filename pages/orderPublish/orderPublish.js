// pages/orderPublish/orderPublish.js
const env = require('../../config/env.js')
const app = getApp()

Page({
  data: {
    // 服务类型
    serviceTypes: [
      { value: 'run', label: '跑刀', desc: '快速搜刮物资撤离' },
      { value: 'escort', label: '护航', desc: '保护老板安全撤离' },
      { value: 'farm', label: '代肝', desc: '代刷经验/任务/材料' }
    ],

    // 地图列表
    mapList: env.MAP_LIST,

    // 价格类型
    priceTypes: [
      { value: 'fixed', label: '一口价' },
      { value: 'hour', label: '时薪' }
    ],

    // 表单数据
    form: {
      serviceType: 'run',
      map: '',
      requirement: '',
      expectedProfit: '',
      priceType: 'fixed',
      price: '',
      contact: ''
    },

    // 上传图片
    images: [],
    uploading: false,

    // 地图选择器
    mapIndex: -1,
    mapPickerVisible: false,

    // 价格类型
    priceTypeIndex: 0,

    submitting: false
  },

  onLoad() {
    // 打手不能发布订单
    const userInfo = app.globalData.userInfo
    if (userInfo && userInfo.role === 'player') {
      wx.showToast({ title: '仅老板可发布订单', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    // 检查登录状态
    if (!app.globalData.openid) {
      this.initApp()
    }
  },

  async initApp() {
    try {
      await app.doLogin()
      await app.fetchUserInfo()
    } catch (err) {
      console.error('初始化失败:', err)
    }
  },

  // 服务类型选择
  onServiceTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ 'form.serviceType': type })
  },

  // 地图选择
  onMapPickerShow() {
    this.setData({ mapPickerVisible: true })
  },
  onMapPickerHide() {
    this.setData({ mapPickerVisible: false })
  },
  onMapSelect(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({
      mapIndex: index,
      'form.map': this.data.mapList[index],
      mapPickerVisible: false
    })
  },

  // 价格类型选择
  onPriceTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ 'form.priceType': type })
  },

  // 输入绑定
  onInputChange(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  // 上传图片
  onChooseImage() {
    const that = this
    const maxCount = 6 - this.data.images.length
    if (maxCount <= 0) {
      wx.showToast({ title: '最多上传6张图片', icon: 'none' })
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

  // 批量上传图片到云存储
  async uploadImages(files) {
    this.setData({ uploading: true })
    const uploadTasks = files.map(file => {
      return this.uploadSingleImage(file.tempFilePath)
    })

    try {
      const results = await Promise.all(uploadTasks)
      const newImages = results.map(r => r.fileID)
      this.setData({
        images: [...this.data.images, ...newImages],
        uploading: false
      })
      wx.showToast({ title: '上传成功', icon: 'success' })
    } catch (err) {
      console.error('上传失败:', err)
      this.setData({ uploading: false })
      wx.showToast({ title: '上传失败，请重试', icon: 'none' })
    }
  },

  // 单张图片上传
  uploadSingleImage(tempFilePath) {
    return new Promise((resolve, reject) => {
      const cloudPath = `orders/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      wx.cloud.uploadFile({
        cloudPath,
        filePath: tempFilePath,
        success: res => resolve(res),
        fail: err => reject(err)
      })
    })
  },

  // 删除已选图片
  onDeleteImage(e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.images
    images.splice(index, 1)
    this.setData({ images })
  },

  // 提交订单
  async onSubmit() {
    const { form } = this.data

    // 表单校验
    if (!form.map) {
      wx.showToast({ title: '请选择地图', icon: 'none' })
      return
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' })
      return
    }
    if (!form.contact) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '发布中...', mask: true })

    try {
      const res = await wx.cloud.callFunction({
        name: 'publishOrder',
        data: {
          serviceType: form.serviceType,
          map: form.map,
          requirement: form.requirement,
          expectedProfit: form.expectedProfit,
          priceType: form.priceType,
          price: parseFloat(form.price),
          contact: form.contact,
          images: this.data.images
        }
      })

      wx.hideLoading()
      if (res.result && res.result.success) {
        wx.showToast({ title: '发布成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({ title: res.result?.message || '发布失败', icon: 'none' })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('发布订单失败:', err)
      wx.showToast({ title: '发布失败，请重试', icon: 'none' })
    }

    this.setData({ submitting: false })
  },

  // 阻止弹窗冒泡
  noop() {}
})
