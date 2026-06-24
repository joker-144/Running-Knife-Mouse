// components/order-card/order-card.js
const util = require('../../utils/util.js')

Component({
  properties: {
    order: {
      type: Object,
      value: {}
    }
  },

  data: {
    serviceTypeText: '',
    statusInfo: {},
    formatTime: '',
    priceText: ''
  },

  observers: {
    'order': function(order) {
      if (!order) return
      this.processOrderData(order)
    }
  },

  methods: {
    processOrderData(order) {
      const serviceTypeText = util.getServiceTypeName(order.serviceType)
      const statusInfo = util.getOrderStatusInfo(order.status)
      const formatTime = util.formatTime(order.createTime, 'relative')
      const priceText = '¥' + order.price + (order.priceType === 'hour' ? '/h' : '')

      this.setData({
        serviceTypeText,
        statusInfo,
        formatTime,
        priceText
      })
    }
  }
})
