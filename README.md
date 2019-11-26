# 消息通信 for We App

集中式的消息管理，用于相互独立的多模块间的消息互通，
1. 支持已触发消息的消息体暂存
2. 支持全局域和模块域的消息隔离
3. 支持模块域的消息冒泡到全局域

## API

默认导出的是当前微应用的`cem`，可以通过`cem.create(namespace: string)`创建新的消息管理器。

1. `on` 监听事件。
  ```
  on(eventName: string, callback: (event: { type: string, target: string, data: any }) => void, instant: boolean) => void
  ```
  1. eventName 事件名称。可通过namespace订阅其他域的消息，如 on('other:name')。
  2. callback 事件回调，接收的参数event，event的具体内容如下：
    * type 事件名称，同trigger时传入的eventName，见下文。
    * target 触发事件的namespace，因为允许A域触发B域的事件。
    * data 触发事件时传入的数据。
  3. instant
    * boolean 即刻执行，当事件已触发，新注册的监听将即刻执行，做事件补偿。默认为true。
    * object 
      - instant 即刻执行，当事件已触发，新注册的监听将即刻执行，做事件补偿。默认为true。
      - once 仅监听一次。
      - onlyData callback仅接收data。

2. `once` 仅监听一次。参数同on的参数，instant.once始终为true。
3. `off` 取消监听。传入eventName和callback。
  ```
  on(eventName: string, callback: (event: { type: string, target: string, data: any }) => void) => void
  ```
4. `trigger` 触发事件，传入eventName和data。
  ```
  trigger(eventName: string, data: any) => void
  ```
5. `trackShareData`, `trackShareDataOnce` 监听全局共享数据。
  ```
  trackShareData(callback: (data: object) => void) => void
  ```
6. `stopTrackShareData` 取消监听全局共享数据。
  ```
  stopTrackShareData(callback: (data: object) => void) => void
  ```
7. `shareData` 发送共享数据。
  ```
  shareData(data: object) => void
  ```
