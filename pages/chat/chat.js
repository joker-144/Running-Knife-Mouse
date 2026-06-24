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
    this.loadMessages()
    // 定时刷新消息
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
          page: this.data.page
        }
      })

      if (res.result && res.result.success) {
        const newMessages = (res.result.data || []).reverse()
        this.setData({
          messages: this.data.page === 1 ? newMessages : [...newMessages, ...this.data.messages],
          hasMore: newMessages.length >= env.CHAT.PAGE_SIZE,
          loading: false
        })
        
        // 滚动到底部
        if (this.data.messages.length > 0 && this.data.page === 1) {
          this.scrollToBottom()
        }
      } else {
        this.setData({ loading: false })
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
        const latest = res.result.data
        const currentIds = this.data.messages.map(m => m._id)
        const newMsgs = latest.filter(m => !currentIds.includes(m._id))
        if (newMsgs.length > 0) {
          this.setData({
            messages: [...this.data.messages, ...newMsgs.reverse()]
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
      }
    } catch (err) {
      console.error('发送失败:', err)
      wx.showToast({ title: '发送失败', icon: 'none' })
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
