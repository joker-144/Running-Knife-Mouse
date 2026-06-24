// components/status-tag/status-tag.js
const util = require('../../utils/util.js')

Component({
  properties: {
    status: {
      type: String,
      value: 'pending'
    },
    showDot: {
      type: Boolean,
      value: true
    }
  },

  data: {
    text: '',
    color: '',
    dotColor: ''
  },

  observers: {
    'status': function(status) {
      if (!status) return
      const info = util.getOrderStatusInfo(status)
      this.setData({
        text: info.text,
        color: info.color,
        dotColor: info.color
      })
    }
  }
})
