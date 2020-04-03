/**
 * 基于CustomEvent实现跨模块的自定义事件触发和监听
 * 1. 不同模块定义不同的域
 * 2. 定义全局域，供全局共享数据
 * 3. 支持不同域跨域订阅消息，namespace:eventType
 * 4. 支持已触发事件的消息体暂存，以支持新订阅即刻获取返回
 */
import has from 'lodash-es/has';
import get from 'lodash-es/get';
import isEqual from 'lodash-es/isEqual';
import { GLOBAL_NAMESPACE, MICROAPP_NAMESPACE, cems,
  callbackMap, ranCustomEventBody, customEventListeners, SHARE_DATA_EVENT } from './const';
import { InstantObj, OnlyData, DataCallback, EventCallback, EvCallback, TriggerOpts, DataPath } from './types';
import timeout from './timeout';

class CustomEventManager {
  _domain: string;

  _namespace: string;

  _domainNS: string;

  constructor(ns: string) {
    if (!ns) {
      throw new Error('Must specify namespace!!!');
    }

    let domain = GLOBAL_NAMESPACE;
    let namespace = '';
    if (ns !== GLOBAL_NAMESPACE) {
      domain = MICROAPP_NAMESPACE;
      namespace = ns;
    }

    const domainNS = domain + (namespace && '/') + namespace;
    if (cems[domainNS]) {
      return cems[domainNS];
    }
    cems[domainNS] = this;

    this._domain = domain;
    this._namespace = namespace;
    this._domainNS = domainNS;
  }

  create(namespace: string) {
    return new CustomEventManager(namespace);
  }

  on(type: string, cb: EventCallback, instantObj: boolean | InstantObj = { instant: true }) {
    let instant = instantObj as boolean;
    let once = false;
    let onlyData: boolean | OnlyData = false;
    // 外部传入的callback被内部进行了包装，需要缓存对应关系
    const cbGuid = cb.__guid || getGuid();
    cb.__guid = cbGuid;

    if (isObj(instantObj)) {
      instant = (instantObj as InstantObj).instant || true;
      once = (instantObj as InstantObj).once;
      onlyData = (instantObj as InstantObj).onlyData;
    }

    const eventType = getFullEventType(type, this._domainNS);
    const hasRanCustomEvent = eventType in ranCustomEventBody;

    if (once && instant && hasRanCustomEvent) {
      const called = triggerInstant(eventType, cb, {
        instant,
        once,
        onlyData: onlyData as OnlyData,
      });
      if (called) {
        return;
      }
    }

    let callback: EvCallback;
    // 仅需要数据的场景
    if (onlyData) {
      const { dataPath } = onlyData as OnlyData;
      // 按路径获取数据
      if (dataPath) {
        callback = (ev) => {
          const { data, prevData } = ev.detail;

          if (has(data, dataPath)) {
            const val = get(data, dataPath);
            const prevVal = get(prevData, dataPath);

            if (val !== prevVal) {
              cb(val);

              once && this.off(type, cb);
            }
          }
        };
      } else {
        callback = (ev) => {
          cb(ev.detail.data);

          once && this.off(type, cb);
        };
      }
    } else {
      callback = (ev) => {
        cb(ev.detail);

        once && this.off(type, cb);
      };
    }

    const guid = callback.guid || getGuid();
    callback.guid = guid;
    // 按照id存储原始callback与内部包装后callback的关系
    callbackMap[cbGuid] = callbackMap[cbGuid] || [];
    callbackMap[cbGuid].push(guid);

    window.addEventListener(eventType, callback);

    if (instant && hasRanCustomEvent) {
      triggerInstant(eventType, cb, {
        instant,
        once,
        onlyData: onlyData as OnlyData,
      });
    }

    const listeners = customEventListeners[eventType] || {};
    if (!(guid in listeners)) {
      listeners[guid] = callback;
    }
    customEventListeners[eventType] = listeners;
  }

  once(type: string, cb: EventCallback, instantObj: InstantObj = { instant: true }) {
    let config = {};
    if (typeof instantObj === 'boolean') {
      config = {
        instant: instantObj,
      };
    }

    this.on(type, cb, {
      ...config,
      once: true,
    });
  }

  off(type: string, cb: EventCallback) {
    const eventType = getFullEventType(type, this._domainNS);

    const etListeners = customEventListeners[eventType] || {};
    let listeners = [];

    if (cb) {
      const cbGuid = cb.__guid;
      const guid = (callbackMap[cbGuid] || []).shift();
      if (guid) {
        const callback = etListeners[guid];
        if (callback) {
          listeners = [callback];
          delete etListeners[guid];
        }
      }
    } else if (listeners) {
      listeners = Object.keys(etListeners).map((guid) => etListeners[guid]);
      delete customEventListeners[eventType];
    }

    listeners.forEach((callback) => {
      if (!callback) {
        return;
      }
      console.log('off', eventType, callback.guid, callback);
      window.removeEventListener(eventType, callback);
    });
  }

  trigger(type: string, data: any, opts: TriggerOpts = { silent: false }) {
    const eventType = getFullEventType(type, this._domainNS);

    console.log('cem trigger', this._domainNS, eventType, data);

    const prevDetail = ranCustomEventBody[eventType] || {};
    const detail = {
      type,
      target: this._namespace || 'GLOBAL',
      prevTarget: prevDetail.target,
      data,
      prevData: prevDetail.data,
    };

    if (!(opts && opts.silent)) {
      const ev = new CustomEvent(eventType, {
        detail,
      });
      window.dispatchEvent(ev);
    }

    ranCustomEventBody[eventType] = detail;

    return this;
  }

  trackShareData(dataPath: DataPath | DataCallback, cb: DataCallback, instantObj: InstantObj = { instant: true }) {
    let callback = cb;
    if (typeof dataPath === 'function') {
      callback = dataPath as DataCallback;
      dataPath = undefined;
      instantObj = cb as InstantObj;
    }
    if (!callback) {
      throw new Error('Please specify callback for trackShareData');
    }

    this.on(SHARE_DATA_EVENT, callback, {
      ...instantObj,
      instant: true,
      onlyData: {
        dataPath: dataPath as DataPath,
      },
    });
  }

  trackShareDataOnce(dataPath: DataPath | DataCallback, cb: DataCallback) {
    this.trackShareData(dataPath, cb, {
      once: true,
    });
  }

  stopTrackShareData(callback: DataCallback) {
    if (!callback) {
      throw new Error('Please specify callback for stopTrackShareData');
    }

    this.off(SHARE_DATA_EVENT, callback);
  }

  shareData(data: any, opts?: TriggerOpts) {
    if (!isObj(data)) {
      throw new Error('data must be object');
    }
    const prevData = (ranCustomEventBody[SHARE_DATA_EVENT] || {}).data;
    const currentData = {
      ...prevData,
      ...data,
    };

    try {
      // 数据无变化不触发变更事件
      if (isEqual(prevData, currentData)) {
        return;
      }

      this.trigger(SHARE_DATA_EVENT, currentData, opts);
    } catch (error) {
      console.log(error);
    }
  }

  getShareData = (dataPath?: DataPath, instantObj: InstantObj = { instant: true }) => {
    const p = new Promise((resolve) => {
      const callback = (data: any) => {
        if (data !== undefined) {
          resolve(data);
          this.stopTrackShareData(callback);
        }
      };
      const params: any[] = [callback, instantObj];
      if (dataPath) {
        params.unshift(dataPath);
      }
      this.trackShareData.apply(this, params);
    });
    return timeout(p, 100, `getShareData for '${dataPath?.toString?.()}' timeout in 100ms`);
  };
}

declare global {
  interface Window {
    MICRO_APPNAME: string;
  }
}

window.MICRO_APPNAME = '';
// @ts-ignore
// eslint-disable-next-line no-undef
const cem = new CustomEventManager(MICRO_APPNAME || GLOBAL_NAMESPACE);

// 初始触发一次数据初始化
cem.shareData({}, { silent: true });

export default cem;

function getFullEventType(type = '', domainNS: string) {
  let eventType = `${domainNS}:${type}`;
  const ns = type.split(':');
  if (ns.length > 1) {
    if (ns[0] !== GLOBAL_NAMESPACE) {
      eventType = `${MICROAPP_NAMESPACE}/${ns[0]}:${ns.slice(1).join('')}`;
    } else {
      eventType = type;
    }
  }
  return eventType;
}

let Guid = 0;
function getGuid() {
  return `${Date.now()}:${++Guid}`;
}

function isObj(o: any) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function triggerInstant(eventType: string, cb: EventCallback, instantObj: InstantObj) {
  const { instant, onlyData } = instantObj;

  const detail = {
    ...ranCustomEventBody[eventType],
    instant,
  };

  let val = detail;

  let called = false;

  if (onlyData) {
    const { dataPath } = onlyData as OnlyData;

    val = detail.data;

    if (dataPath) {
      if (has(val, dataPath)) {
        val = get(val, dataPath);
        called = true;
        cb(val);
      }
    } else {
      called = true;
      cb(val);
    }
  } else {
    called = true;
    cb(val);
  }

  return called;
}
