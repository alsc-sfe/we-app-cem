// 全局消息命名空间
const GLOBAL_NAMESPACE = '__GLOBAL_CUSTOM_EVENT_NAMESPACE__';
// 单个微应用命名空间
const MICROAPP_NAMESPACE = '__MICROAPP_CUSTOM_EVENT_NAMESPACE__';
// 全局分享数据命名空间
const SHARE_DATA_EVENT = `${GLOBAL_NAMESPACE}:__SHARE_DATA_EVENT__`;

export {
  GLOBAL_NAMESPACE,
  MICROAPP_NAMESPACE,
  SHARE_DATA_EVENT,
};

// 全局缓存
// 进行全局缓存，保证始终只有一个缓存区
const GLOBAL_CEM_CACHE_NAME = Symbol.for('__GLOBAL_CEM_CACHE__');
const GLOBAL_CEM_CACHE = window[GLOBAL_CEM_CACHE_NAME] || {};
window[GLOBAL_CEM_CACHE_NAME] = GLOBAL_CEM_CACHE;

const cems = GLOBAL_CEM_CACHE.cems || {};
GLOBAL_CEM_CACHE.cems = cems;

const customEventListeners = GLOBAL_CEM_CACHE.customEventListeners || {};
GLOBAL_CEM_CACHE.customEventListeners = customEventListeners;

const ranCustomEventBody = GLOBAL_CEM_CACHE.ranCustomEventBody || {};
GLOBAL_CEM_CACHE.ranCustomEventBody = ranCustomEventBody;

const callbackMap = GLOBAL_CEM_CACHE.callbackMap || {};
GLOBAL_CEM_CACHE.callbackMap = callbackMap;

export {
  GLOBAL_CEM_CACHE,
  cems,
  customEventListeners,
  ranCustomEventBody,
  callbackMap,
};
