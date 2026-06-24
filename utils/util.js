// utils/util.js - 工具函数
const env = require('../config/env.js')

/**
 * 格式化时间
 * @param {Date|string} date - 日期
 * @param {string} format - 格式 (full/time/relative)
 */
const formatTime = (date, format = 'full') => {
  if (!date) return ''
  
  let d
  if (typeof date === 'string') {
    d = new Date(date)
  } else if (date.getTime) {
    d = date
  } else {
    return ''
  }

  const year = d.getFullYear()
  const month = padZero(d.getMonth() + 1)
  const day = padZero(d.getDate())
  const hour = padZero(d.getHours())
  const minute = padZero(d.getMinutes())
  const second = padZero(d.getSeconds())

  if (format === 'full') {
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  } else if (format === 'date') {
    return `${year}-${month}-${day}`
  } else if (format === 'time') {
    return `${hour}:${minute}`
  } else if (format === 'short') {
    return `${month}-${day} ${hour}:${minute}`
  } else if (format === 'relative') {
    return getRelativeTime(d)
  }
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 补零
 */
const padZero = (num) => {
  return num < 10 ? '0' + num : num
}

/**
 * 获取相对时间描述
 */
const getRelativeTime = (date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < 7 * day) {
    return Math.floor(diff / day) + '天前'
  } else {
    return formatTime(date, 'short')
  }
}

/**
 * 格式化价格
 */
const formatPrice = (price) => {
  if (typeof price !== 'number') return '0.00'
  return price.toFixed(2)
}

/**
 * 计算平台抽成
 */
const calcPlatformFee = (amount) => {
  return Math.round(amount * env.PLATFORM_FEE_RATE * 100) / 100
}

/**
 * 计算打手实际收益
 */
const calcPlayerEarning = (amount) => {
  return amount - calcPlatformFee(amount)
}

/**
 * 获取订单状态信息
 */
const getOrderStatusInfo = (status) => {
  const statusMap = {
    pending: { text: '待接单', color: '#F5A623', icon: '🔶' },
    accepted: { text: '已接单', color: '#3498DB', icon: '🔷' },
    ongoing: { text: '进行中', color: '#2ECC71', icon: '🟢' },
    completed: { text: '已完成', color: '#A0B0C0', icon: '✅' },
    settled: { text: '已结算', color: '#2ECC71', icon: '💰' },
    cancelled: { text: '已取消', color: '#E74C3C', icon: '❌' }
  }
  return statusMap[status] || { text: '未知', color: '#A0B0C0', icon: '❓' }
}

/**
 * 获取服务类型名称
 */
const getServiceTypeName = (type) => {
  return env.SERVICE_TYPE[type] || '未知'
}

/**
 * 获取认证状态信息
 */
const getVerifyStatusInfo = (status) => {
  const statusMap = {
    pending: { text: '审核中', color: '#F5A623' },
    approved: { text: '已认证', color: '#2ECC71' },
    rejected: { text: '已拒绝', color: '#E74C3C' }
  }
  return statusMap[status] || { text: '未认证', color: '#A0B0C0' }
}

/**
 * 防抖函数
 */
const debounce = (fn, delay = 300) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数
 */
const throttle = (fn, delay = 300) => {
  let last = 0
  return function (...args) {
    const now = Date.now()
    if (now - last >= delay) {
      last = now
      fn.apply(this, args)
    }
  }
}

/**
 * 简单的表单校验
 */
const validateForm = (form, rules) => {
  for (const key of Object.keys(rules)) {
    const value = form[key]
    const rule = rules[key]
    if (rule.required && (!value || value.toString().trim() === '')) {
      return { valid: false, message: rule.message || `${key}不能为空` }
    }
    if (rule.minLength && value && value.length < rule.minLength) {
      return { valid: false, message: rule.minLengthMsg || `最少需要${rule.minLength}个字符` }
    }
    if (rule.pattern && value && !rule.pattern.test(value)) {
      return { valid: false, message: rule.patternMsg || '格式不正确' }
    }
  }
  return { valid: true }
}

module.exports = {
  formatTime,
  padZero,
  getRelativeTime,
  formatPrice,
  calcPlatformFee,
  calcPlayerEarning,
  getOrderStatusInfo,
  getServiceTypeName,
  getVerifyStatusInfo,
  debounce,
  throttle,
  validateForm
}
