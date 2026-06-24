// pages/withdraw/withdraw.js - 收益提现
const app = getApp()
const env = require('../../config/env.js')

Page({
  data: {
    balance: 0,
    amount: '',
    account: '',
    accountType: 'wechat', // wechat / alipay
    submitting: false,
    records: [],
    loading: true,
    arrivalAmount: '0.00'
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    const userInfo = app.globalData.userInfo

    if (userInfo) {
      this.setData({ balance: userInfo.balance || 0 })
    }

    // 加载提现记录
    try {
      const db = wx.cloud.database()
      const res = await db.collection('withdrawals')
        .where({
          playerOpenid: app.globalData.openid
        })
        .orderBy('createTime', 'desc')
        .limit(env.WITHDRAW.MAX_RECORDS)
        .get()

      this.setData({
        records: res.data || [],
        loading: false
      })
    } catch (err) {
      console.error('加载提现记录失败:', err)
      this.setData({ loading: false })
    }
  },

  onAmountInput(e) {
    const amount = e.detail.value
    const num = parseFloat(amount) || 0
    this.setData({
      amount: amount,
      arrivalAmount: (num * (1 - env.WITHDRAW.FEE_RATE)).toFixed(2)
    })
  },

  onAccountInput(e) {
    this.setData({ account: e.detail.value })
  },

  onAccountTypeChange(e) {
    this.setData({ accountType: e.currentTarget.dataset.type })
  },

  // 全部提现
  onWithdrawAll() {
    const balance = this.data.balance
    this.setData({
      amount: String(balance),
      arrivalAmount: (balance * (1 - env.WITHDRAW.FEE_RATE)).toFixed(2)
    })
  },

  // 提交提现申请
  async onSubmit() {
    const amount = parseFloat(this.data.amount)

    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }
    if (amount < env.WITHDRAW.MIN_AMOUNT) {
      wx.showToast({ title: `最低提现金额为 ¥${env.WITHDRAW.MIN_AMOUNT}`, icon: 'none' })
      return
    }
    if (amount > this.data.balance) {
      wx.showToast({ title: '余额不足', icon: 'none' })
      return
    }
    if (!this.data.account) {
      wx.showToast({ title: '请输入收款账号', icon: 'none' })
      return
    }

    wx.showModal({
      title: '确认提现',
      content: `确认提现 ¥${amount.toFixed(2)} 至${this.data.accountType === 'wechat' ? '微信' : '支付宝'}账号 ${this.data.account}？`,
      success: async (res) => {
        if (!res.confirm) return

        this.setData({ submitting: true })
        wx.showLoading({ title: '提交中...', mask: true })

        try {
          const result = await wx.cloud.callFunction({
            name: 'withdrawApply',
            data: {
              amount,
              account: this.data.account,
              accountType: this.data.accountType
            }
          })

          wx.hideLoading()
          if (result.result && result.result.success) {
            wx.showToast({ title: '提现申请已提交', icon: 'success' })
            this.setData({
              amount: '',
              account: '',
              submitting: false,
              balance: result.result.balance || (this.data.balance - amount)
            })
            this.loadData()
          } else {
            wx.showToast({ title: result.result?.message || '提交失败', icon: 'none' })
            this.setData({ submitting: false })
          }
        } catch (err) {
          wx.hideLoading()
          this.setData({ submitting: false })
          console.error('提现失败:', err)
          wx.showToast({ title: '提交失败', icon: 'none' })
        }
      }
    })
  }
})
