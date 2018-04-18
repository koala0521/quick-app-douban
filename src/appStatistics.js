import storage from '@system.storage' 
import nativeFetch from '@system.fetch'
import device from '@system.device'
import geolocation from '@system.geolocation'


import app from '@system.app'
import router from '@system.router'

// import '../node_modules/fingerprintjs2/fingerprint2.js';

//调试提示
import prompt from '@system.prompt'


// 工具函数
const _toString = Object.prototype.toString;

function isObject (obj) {
    return obj !== null && typeof obj === 'object'
}

function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]'
}

function isArray(obj){
    return Array.isArray(obj)
}

function isEmptyObject(obj){
    for(var n in obj){
        return false
    }
    return true;
}


// 服务器地址
const SERVER_URL = 'https://api.douban.com';

// 测试  /v2/movie/top250?count=20

// 缓存的key值
const STORAGE_KEY = "APP_STATISTICS_DATA";

//  请求封装
const NETWORK = {

    'fetch':function( args ){

        let url = SERVER_URL + args.url;
        let obj = {
            url:SERVER_URL + args.url,
            fail:function(data, code){
                console.log(`请求失败, code = ${code}`);
            }
        };

        Object.assign( obj , args , { url } )
        nativeFetch.fetch(obj);
    },
    'get':function( args ){

        args.method = "GET";
        return this.fetch(args);
    },
    'post':function( args ){

        args.method = "POST";
        return this.fetch(args);
    }
} 


const APP_STATISTICS = {

    'baseData':{
        // 应用包名：应用的唯一标识
        'package':'',

        // 来源平台
        'packageName':'',

        'name':'',

        'deviceId':'',
        
        'macId':'',
        
        'userId':'',
        // 广告id
        'advertising':'',

        // 进入app的时间
        'createTime':'',
        // 离开app的时间
        
        'destroyTime':''
    },

    // 设备信息
    'AS_deviceInfo':null,

    'hasStorage':false,
    // 打开app
    createApp( deviceData ){

        const APP = deviceData || { 'options':{} , '_def':{} };
        
        let d = new Date;
        // 解构出  env 和 manifest 对象
        let { options:{ env } , _def:{ manifest } } = APP;
        // 获取当前应用信息
        let { source } = app.getInfo();
        
        console.log( ' 获取当前应用信息 >>>>' , JSON.stringify( source ) );

        APP_STATISTICS.baseData.packageName = source.packageName;

        // 进入时间 待确认是否用前端时间 ？
        APP_STATISTICS.baseData.createTime = d.getTime() + '';

        // 获取应用包名
        APP_STATISTICS.baseData.package = manifest.package;
        
        // 获取应用名称
        APP_STATISTICS.baseData.name = manifest.name;

        // 读取设备id和用户id
        device.getId({

            'type': ['device', 'mac','user', 'advertising'], // 最少一个，最多四个
            'success': function (data) {

                APP_STATISTICS.baseData.deviceId = data.device;
                APP_STATISTICS.baseData.macId = data.mac;
                APP_STATISTICS.baseData.userId = data.user;
                APP_STATISTICS.baseData.advertisingId = data.advertising;

                APP_STATISTICS.getStorage()
            },
            'fail': function (data, code) {
                console.log(`handling fail, code = ${code}`)
            }
        });
        // 获取设备信息
        device.getInfo({
            'success':function( data ){
                APP_STATISTICS.AS_deviceInfo = Object.assign( {} , data );     

            }
        });

        // 获取地理位置
        console.log( '开始获取地理位置...' );
        
        geolocation.getLocation({

            success: function (data) {
              console.log(`地理位置 success: longitude = ${data.longitude}, latitude = ${data.latitude}`)
            },
            fail: function (data, code) {
              console.log(`地理位置 fail, code = ${code}`)
            }
        })

        // 测试 请求
        // NETWORK.get({
        //     url:'/v2/movie/top250?count=20',
        //     success(data){
        //         console.log( `请求成功code= ${ data.code }, data=${ JSON.stringify(data) } ` );
                
        //     }
        // });
        
    },
    // 关闭app
    destroyApp(){
        
        console.log( "关闭app" );

        let d = new Date + '';
        // 关闭时间
        APP_STATISTICS.baseData.destroyTime = d.getTime();
    },

    // 设置缓存
    setStorage(){

        console.log('开始设置缓存数据');
        // 缓存数据
        let data = {
            'baseData': APP_STATISTICS.baseData,
            'AS_deviceInfo':APP_STATISTICS.AS_deviceInfo
        }

        storage.delete({
            'key':STORAGE_KEY
        });
        storage.set({
            'key':STORAGE_KEY,
            'value':JSON.stringify( data ),
            'success':function(){

                console.log( '设置缓存成功' );                
            }
        });
        
    },

    // 读取缓存
    getStorage(){
        
        console.log('读取缓存...');
        let that = this;
        storage.get({

            'key':STORAGE_KEY,
            'success': function (data) {
                // console.log( '读取到的缓存数据' ,data );
                let storageData = data && JSON.parse( data );

                if(  storageData && storageData.baseData.deviceId ){

                    console.log('读取成功...' , JSON.stringify( storageData ));
                    that.hasStorage = true;
 
                }else{

                    APP_STATISTICS.setStorage()
                }

              }
        });
    }

};


// 全局变量
// const hookTo = global.__proto__ || global


export default APP_STATISTICS 



