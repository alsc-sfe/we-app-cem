---
order: 1
title: demo1
---

PC模板

````jsx
import cem from "@saasfe/we-app-cem";

// 微应用bcommon
cem.on('test', function(ev){
  log('bcommon on bcommon:test', ev);
});
cem.trigger('test', {
  test: 'bcommon trigger bcommon:test'
});
cem.on('test', function(ev){
    log('bcommon on bcommon:test instant', ev);
});

cem.trackShareData(function(data) {
  console.log('bcommon trackShareData', data);
});
cem.trackShareData('shopId', function(data) {
  console.log('bcommon trackShareData shopId', data);
});
cem.trackShareData('shopInfo.shopId', function(data) {
  console.log('bcommon trackShareData shopInfo.shopId', data);
});
cem.shareData({
  shopId: 123,
  shopName: '丁璞名称',
  shopInfo: {
    shopId: 937472,
    shopName: '店铺名称',
  },
});

// 模块域 mod1
var cemMod1 = cem.create('mod1');
cemMod1.on('testMod1', function(ev){
    log('mod1 on mod1:testMod1', ev);
});
cemMod1.trigger('testMod1', {
    test: 'mod1 trigger mod1:testMod1'
});
cemMod1.on('testMod1', function(ev){
    log('mod1 on mod1:testMod1 instant', ev);
});
function trackShareDataMod1(data) {
  console.log('mod1 trackShareData', data);
}
cemMod1.trackShareData(trackShareDataMod1);
// 重复创建同一模块域
var cemMod1R = cem.create('mod1').trigger('testMod1', {
    test: 'recreate mod1 trigger mod1:testMod1'
});
// 仅监听一次
cemMod1.once('testMod1', function(ev) {
  log('mod1 on mod1:testMod1 once', ev);
});

log('recreate mod1 is same object', cemMod1 === cemMod1R);

// 模块域 mod2
var cemMod2 = cem.create('mod2');
cemMod2.on('testMod2', function(ev){
    log('mod2 on mod2:testMod2', ev);
});
cemMod2.trigger('testMod2', {
    test: 'mod2 trigger mod2:testMod2'
});
cemMod2.on('testMod2', function(ev){
    log('mod2 on mod2:testMod2 instant', ev);
});
// 监听跨模块域事件
cemMod2.on('mod1:testMod1', function(ev) {
  log('mod2 on mod1:testMod1', ev);
})
// 触发跨模块域事件
cemMod2.trigger('mod1:testMod1', {
  log: 'mod2 trigger mod1:testMod1',
});
// 取消mod1监听
log('mod1 off mod1:testMod1, none listener when mod1 trigger mod1:testMod1');
cemMod1.off('testMod1');
cemMod1.trigger('testMod1', {
  log: 'mod1 trigger mod1:testMod1 after off mod1:testMod1, mod1 donot listen it'
});
cemMod2.trigger('mod1:testMod1', {
  log: 'mod2 trigger mod1:testMod1 after off mod1:testMod1, mod1 donot listen it'
});
// mod1取消共享数据获取，mod2触发分享数据，mod1不会获取到共享数据
cemMod1.stopTrackShareData(trackShareDataMod1);
cemMod2.shareData({
  mod2: 'hello mod1',
  shopInfo: {
    shopId: 2394,
    shopName: '榆树岭',
  },
});

cem.trackShareDataOnce('mod2', (mod2) => {
  console.log('cem.trackShareDataOnce mod2', mod2);
});
cem.shareData({
  mod2: 'hello mod2',
});

function log(msg, ev) {
  typeof ev === 'object' ?
    console.log(msg, ev.target, ev.type, ev)
    : console.log(msg, ev || '');
}
````
