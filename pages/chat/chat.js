// pages/chat/chat.js - 订单沟通
const app = getApp()
const env = require('../../config/env.js')

Page({
  data: {
    orderId: '',
    messages: [],
    inputValue: '',
    scrollToView: '',
    page: 1,
    hasMore: true,
    loading: false,
    myOpenid: '',
    toOpenid: '',
    order: null,
    intervalId: null
  },

  onLoad(options) {
    this.setData({
      orderId: options.orderId || '',
      myOpenid: app.globalData.openid
    })
    if (!this.data.orderId) {
      wx.showToast({ title: '订单ID无效', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
  },

  onShow() {
    // 每次页面显示时更新 myOpenid，确保登录后正确区分自己和他人的消息
    const myOpenid = app.globalData.openid
    if (myOpenid) {
      this.setData({ myOpenid })
    }
    this.loadMessages()
    // 清除旧定时器再新建，防止泄漏
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId)
    }
    const intervalId = setInterval(() => {
      this.pollMessages()
    }, env.CHAT.POLL_INTERVAL)
    this.setData({ intervalId })
  },

  onHide() {
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId)
    }
  },

  onUnload() {
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId)
    }
  },

  async loadMessages() {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMessages',
        data: {
          orderId: this.data.orderId,
          page: this.data.page,
          pageSize: env.CHAT.PAGE_SIZE
        }
      })

      if (res.result && res.result.success) {
        // 云函数返回的数据已是正序（最旧→最新），直接使用
        const newMessages = res.result.data || []
        this.setData({
          messages: this.data.page === 1
            ? newMessages
            : [...newMessages, ...this.data.messages],
          hasMore: newMessages.length >= env.CHAT.PAGE_SIZE,
          loading: false
        })
        
        // 滚动到底部
        if (this.data.messages.length > 0 && this.data.page === 1) {
          this.scrollToBottom()
        }
      } else {
        // 加载失败不清空已有消息
        this.setData({ loading: false })
        if (res.result?.message) {
          console.warn('加载消息失败:', res.result.message)
        }
      }
    } catch (err) {
      console.error('加载消息失败:', err)
      this.setData({ loading: false })
    }
  },

  async pollMessages() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMessages',
        data: {
          orderId: this.data.orderId,
          page: 1,
          pageSize: env.CHAT.POLL_SIZE
        }
      })
      if (res.result && res.result.success && res.result.data) {
        // 云函数返回正序（最旧→最新），比对新旧消息
        const latest = res.result.data
        const currentIds = this.data.messages.map(m => m._id)
        const newMsgs = latest.filter(m => !currentIds.includes(m._id))
        if (newMsgs.length > 0) {
          // 直接追加到末尾（已正序）
          this.setData({
            messages: [...this.data.messages, ...newMsgs]
          })
          this.scrollToBottom()
        }
      }
    } catch (err) {
      // 静默失败
    }
  },

  onInputChange(e) {
    this.setData({ inputValue: e.detail.value })
  },

  async onSendMessage() {
    const content = this.data.inputValue.trim()
    if (!content) return

    this.setData({ inputValue: '' })

    // 乐观更新
    const tempMsg = {
      _id: 'temp_' + Date.now(),
      fromOpenid: this.data.myOpenid,
      content,
      type: 'text',
      createTime: new Date(),
      isTemp: true
    }
    this.setData({
      messages: [...this.data.messages, tempMsg]
    })
    this.scrollToBottom()

    try {
      const res = await wx.cloud.callFunction({
        name: 'sendMessage',
        data: {
          orderId: this.data.orderId,
          content,
          type: 'text'
        }
      })

      if (res.result && res.result.success) {
        // 替换临时消息
        const msgs = this.data.messages.map(m => {
          if (m._id === tempMsg._id) {
            return { ...res.result.data, isTemp: false }
          }
          return m
        })
        this.setData({ messages: msgs })
      } else {
        // 发送失败，移除临时消息
        const msgs = this.data.messages.filter(m => m._id !== tempMsg._id)
        this.setData({ messages: msgs })
        const failMsg = res.result?.message || '发送失败'
        wx.showToast({ title: failMsg, icon: 'none', duration: 2000 })
      }
    } catch (err) {
      console.error('发送失败:', err)
      // 移除失败临时消息
      const msgs = this.data.messages.filter(m => m._id !== tempMsg._id)
      this.setData({ messages: msgs })
      const errMsg = err.errMsg || '发送失败'
      wx.showToast({ title: errMsg, icon: 'none', duration: 2000 })
    }
  },

  scrollToBottom() {
    this.setData({ scrollToView: '' })
    setTimeout(() => {
      if (this.data.messages.length > 0) {
        const lastMsg = this.data.messages[this.data.messages.length - 1]
        this.setData({ scrollToView: `msg-${lastMsg._id}` })
      }
    }, env.CHAT.SCROLL_DELAY)
  },

  onLoadMoreMessages() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadMessages()
  }
})
